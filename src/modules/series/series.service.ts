import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Series, WatchingStatus } from './models';
import { SeriesRepository } from './series.repository';
import { AnimeById } from 'jikants/dist/src/interfaces/anime/ById';
import { Search, Anime } from '../../jikan';
import { SeasonService } from '../season/season.service';
import { Anime as AnimeSeason } from '../../jikan/interfaces/season/Season';

import { AuthorizationCode } from 'simple-oauth2';
import { SubGroupService } from '../sub-group';
import { SeasonName } from '../season/models';
import { SettingsService } from '../settings/settings.service';
import { SubGroup } from '../sub-group/models';
import { SubGroupRule, RuleType } from '../sub-group-rule/models';

const config = {
  client: {
    id: '3d6658c97562e9a4d2c5234258b08878',
    secret: '35b47ce2ed7e13430ec64fa4cba5d2caf7494f88ba13d1d30d5c4af5296c62e4',
  },
  auth: {
    tokenHost: 'https://myanimelist.net/v1/oauth2/authorize',
  },
};

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: SeriesRepository,

    @Inject(forwardRef(() => SubGroupService))
    private subgroupService: SubGroupService,

    @Inject(forwardRef(() => SeasonService))
    private seasonService: SeasonService,

    @Inject(SettingsService)
    private readonly settingsService: SettingsService,
  ) {}

  public async create(series: Series) {
    const { value: subgroupName } = await this.settingsService.findByKey('defaultSubgroup');

    if (!series.subgroups || series.subgroups.length === 0) {
      const subGroup = new SubGroup();

      subGroup.name = subgroupName;
      subGroup.preferedResultion = '720';

      const rule = new SubGroupRule();
      rule.isPositive = true;
      rule.ruleType = RuleType.STARTS_WITH;
      rule.text = series.name;

      subGroup.addRule(rule);

      series.subgroups = [subGroup];
    }

    return this.seriesRepository.save(series);
  }

  public async findFromMAL(seriesName: string) {
    const foundAnime = await Search.search(seriesName, 'anime', 1);

    if ((foundAnime?.results?.length ?? 0) === 0) {
      throw Error('Show Not Found');
    }

    return (await Promise.all(foundAnime.results.map(async result => this.createFromMAL(await Anime.byId(result.mal_id))))).filter(
      show => show.imageUrl,
    );
  }

  public async getToken() {
    console.log('TEST');
    const client = new AuthorizationCode(config);

    const authorizationUri = client.authorizeURL({
      redirect_uri: 'http://localhost:3000/callback',
    });

    const tokenParams = {
      code: 'AUTHORIZATION_CODE',
      redirect_uri: 'http://localhost:3000/callback',
      code_challenge_method: 'plain',
      response_type: 'code',
    };

    try {
      const accessToken = await client.getToken(tokenParams, { json: true });

      console.log(accessToken);
    } catch (error) {
      console.log('Access Token Error', error.message);
    }
  }

  public async createFromMALName(seriesName: string) {
    const foundAnime = await Search.search(seriesName, 'anime', 1);

    if ((foundAnime?.results?.length ?? 0) === 0) {
      throw Error('Show Not Found');
    }

    return this.createFromMAL(await Anime.byId(foundAnime.results[0].mal_id));
  }

  public async createFromMALId(id: number) {
    const series = this.createFromMAL(await Anime.byId(id));

    const defaultSeason = await this.settingsService.findByKey('currentSeason');
    const defaultYear = await this.settingsService.findByKey('currentYear');

    series.season = await this.seasonService.find(defaultSeason.value as SeasonName, Number(defaultYear.value));
    return series;
  }

  public async update(series: Series) {
    return this.seriesRepository.save(series);
  }

  public async delete(series: Series) {
    return this.seriesRepository.remove(series);
  }

  public async deketeById(id: number) {
    const series = await this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id: id } });

    const subPromises = (series.subgroups || []).map(sub => this.subgroupService.delete(sub));

    await Promise.all(subPromises);

    return this.delete(series);
  }

  public async findBySeason(name: string, year: number) {
    return (await this.seasonService.find(name as SeasonName, year))?.series ?? [];
  }

  public async findAll() {
    return this.seriesRepository.find({ relations: ['season', 'subgroups', 'subgroups.rules'] });
  }

  public async findById(seriesId: number) {
    return this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id: seriesId } });
  }

  public createFromMALSeason(animeModel: AnimeSeason) {
    const series = new Series();

    series.airingData = new Date(animeModel.airing_start) || new Date();
    series.description = animeModel.synopsis;
    series.genres = animeModel?.genres?.map(genre => genre.name) ?? [];
    series.imageUrl = animeModel.image_url;
    series.name = animeModel.title;
    series.otherNames = [];
    series.numberOfEpisodes = animeModel.episodes || 0;
    series.score = animeModel.score;
    series.studio = animeModel.licensors?.join(' ') ?? '';
    series.continuing = animeModel.continuing;
    series.tags = [];
    series.watchStatus = WatchingStatus.NOT_WATCHING;

    return series;
  }

  public createFromMAL(animeModel: AnimeById) {
    const series = new Series();

    series.airingData = new Date(animeModel?.aired?.from ?? new Date()) || new Date();
    series.description = animeModel.synopsis;
    series.genres = animeModel?.genres?.map(genre => genre.name) ?? [];
    series.imageUrl = animeModel.image_url;
    series.name = animeModel.title;
    series.otherNames = [animeModel.title_english, animeModel.title_japanese, ...(animeModel?.title_synonyms ?? [])];
    series.numberOfEpisodes = animeModel.episodes || 0;
    series.score = animeModel.score;
    series.studio = animeModel?.studios?.map(({ name }) => name).join(' ') ?? '';
    series.tags = [];
    series.watchStatus = WatchingStatus.NOT_WATCHING;
    series.malId = animeModel.mal_id;

    return series;
  }
}
