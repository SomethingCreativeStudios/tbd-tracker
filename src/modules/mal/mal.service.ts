import { MALClient } from '@chez14/mal-api-lite';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import pkceChallenge from 'pkce-challenge';
import { ensureDirSync } from 'fs-extra';
import { join } from 'path';
import sanitizeFilename from 'sanitize-filename';

import { ConfigService } from '~/config';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { Series, WatchingStatus } from '../series/models';

interface MalResults {
    data: MalNode[],
    paging: {},
    season: { year: number, season: string }
}
interface MalNode {
    node: MalResult
}
interface MalResult {
    id: number,
    title: string,
    start_season: { year: number, season: string }
    main_picture: {
        large: string,
        medium: string
    },
    anime_score: string,
    alternative_titles: { en: string, ja: string, synonyms: string[] },
    start_date: string;
    synopsis: string;
    genres: { id: number, name: string }[];
    num_episodes: number;
    studios: { id: number, name: string }[];
}

const malFields = ['id', 'title', 'start_season', 'anime_score', 'main_picture', 'alternative_titles', 'start_date', 'synopsis', 'genres', 'num_episodes', 'studios'];


@Injectable()
export class MalService {
    private malClient: MALClient;

    constructor(
        private configService: ConfigService,

        private animeFolderService: AnimeFolderService,

        @Inject(CACHE_MANAGER)
        private cacheManager: Cache
    ) {
        this.setup();
    }

    private async setup() {
        const config = this.configService.malConfig;

        this.malClient = new MALClient({
            // Both of the field should be filled if you want to generate authenticate link
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: (await this.cacheManager.get("mal:refresh")) || null,
            accessToken: (await this.cacheManager.get("mal:access")) || null,
            autoRefreshAccessToken: true
        });
    }

    public getAuthUrl() {
        const code = pkceChallenge(56);

        const authUrl = this.malClient.getOAuthURL(this.configService.malConfig.redirectUrl, code.code_challenge);

        return { url: encodeURIComponent(authUrl.url), verifier: code.code_verifier, codeChallenge: code.code_challenge };
    }

    public async getAuthToken(authCode: string, codeVerifier: string) {
        try {
            const result = await this.malClient.resolveAuthCode(authCode, codeVerifier, this.configService.malConfig.redirectUrl);

            await this.cacheManager.set("mal:refresh", result.refresh_token, { ttl: 0 });
            await this.cacheManager.set("mal:access", result.access_token, { ttl: 0 });
            this.malClient.refreshToken = result.refresh_token;
            this.malClient.accessToken = result.access_token;

            return result;
        } catch {
            return { error: true };
        }
    }

    public async searchSeason(year: string, season: string, autoCreateFolder = false) {
        const currentFolder = await this.animeFolderService.getCurrentFolder();
        const results = await this.malClient.get<MalResults>(`anime/season/${year}/${season}`, {
            sort: "title",
            limit: 150,
            fields: malFields,
        });

        return results?.data.map(result => this.toSeries(result.node, currentFolder, autoCreateFolder, +year, season));
    }

    public async search(query: string, autoCreateFolder = false) {
        const currentFolder = await this.animeFolderService.getCurrentFolder();
        const results = await this.malClient.get<MalResults>(`anime`, {
            limit: 100,
            fields: malFields,
            q: query
        });

        return results?.data.map(result => this.toSeries(result.node, currentFolder, autoCreateFolder));
    }

    public async findById(id: number, autoCreateFolder = false) {
        const currentFolder = await this.animeFolderService.getCurrentFolder();
        const result = await this.malClient.get<MalResult>(`anime/${id}`, {
            fields: malFields
        });

        return this.toSeries(result, currentFolder, autoCreateFolder);
    }

    private toSeries(malResult: MalResult, currentFolder: string, autoCreateFolder: boolean, year?: number, season?: string): Series {
        const series = new Series();

        series.airingData = new Date(malResult.start_date) || new Date();
        series.description = malResult.synopsis;
        series.genres = malResult?.genres?.map((genre) => genre.name) ?? [];
        series.imageUrl = malResult.main_picture?.medium;
        series.name = malResult.title;
        series.otherNames = [...malResult?.alternative_titles?.synonyms ?? [], malResult?.alternative_titles?.en, malResult?.alternative_titles?.ja],
            series.numberOfEpisodes = malResult.num_episodes || 0;
        series.score = +malResult.anime_score;
        series.studio = malResult.studios?.map(studio => studio.name)?.join(' ') ?? '';
        if (year) {
            series.continuing = malResult.start_season.year !== year || malResult.start_season.season !== season;
        }
        series.tags = [];
        series.watchStatus = WatchingStatus.THREE_RULE;
        series.malId = malResult.id;

        if (autoCreateFolder) {
            series.folderPath = this.autoMakeFolder(series.name, currentFolder);
        }

        return series;
    }

    private autoMakeFolder(seriesName: string, currentFolder: string) {
        const cleanName = sanitizeFilename(seriesName);
        const folderName = join(currentFolder, cleanName);

        ensureDirSync(folderName);

        return cleanName;
    }
}
