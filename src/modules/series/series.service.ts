import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInCalendarYears } from 'date-fns';
import sanitize from 'sanitize-filename';

import { Series, WatchingStatus } from './models';
import { SeriesRepository } from './series.repository';
import { AnimeById } from 'jikants/dist/src/interfaces/anime/ById';
import { Search, Anime, Season } from '../../jikan';
import { SeasonService } from '../season/season.service';
import { Anime as AnimeSeason } from '../../jikan/interfaces/season/Season';

import { SubGroupService } from '../sub-group';
import { SeasonName } from '../season/models';
import { SettingsService } from '../settings/settings.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';

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

    @Inject(forwardRef(() => AnimeFolderService))
    private readonly animeFolderService: AnimeFolderService,
  ) {}

  public async createFromSeason(series: Series[], name: SeasonName, year: number) {
    const season = await this.seasonService.find(name, year);

    return Promise.all(series.map((show) => this.create({ ...show, season })));
  }

  public async create(series: Series) {
    /*const { value: subgroupName } = await this.settingsService.findByKey('defaultSubgroup');

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
    }*/

    await this.animeFolderService.ensureShowFolder(series.name, series.season.name, series.season.year + '');

    series.folderPath = sanitize(series.name);
    return this.seriesRepository.save(series);
  }

  public async findFromMAL(seriesName: string) {
    const foundAnime = await Search.search(seriesName, 'anime', 1);

    if ((foundAnime?.results?.length ?? 0) === 0) {
      throw Error('Show Not Found');
    }

    return (await Promise.all(foundAnime.results.map(async (result) => this.createFromMAL(await Anime.byId(result.mal_id))))).filter((show) => show.imageUrl);
  }

  public async createFromMALName(seriesName: string) {
    const foundAnime = await Search.search(seriesName, 'anime', 1);

    if ((foundAnime?.results?.length ?? 0) === 0) {
      throw Error('Show Not Found');
    }

    return this.createFromMAL(await Anime.byId(foundAnime.results[0].mal_id));
  }

  public async createFromMALId(id: number, season?, year?, options?: any) {
    const series = await this.createFromMAL(await Anime.byId(id), options);

    const defaultSeason = season || (await this.settingsService.findByKey('currentSeason')).value;
    const defaultYear = year || (await this.settingsService.findByKey('currentYear')).value;

    series.season = await this.seasonService.find(defaultSeason as SeasonName, Number(defaultYear));
    return this.create(series);
  }

  public async update(series: Series) {
    if (series.downloaded > 3 && series.watchStatus === WatchingStatus.THREE_RULE) {
      series.watchStatus = WatchingStatus.WATCHING;
    }

    if (series.downloaded === series.numberOfEpisodes && series.numberOfEpisodes > 1 && series.watchStatus === WatchingStatus.WATCHING) {
      series.watchStatus = WatchingStatus.WATCHED;
    }

    return this.seriesRepository.save(series);
  }

  public async updateWatchStatus(id: number) {
    const series = await this.findById(id);
    const { watchStatus } = series;

    if (watchStatus === WatchingStatus.NOT_WATCHING) {
      series.watchStatus = WatchingStatus.THREE_RULE;
    }

    if (watchStatus === WatchingStatus.THREE_RULE) {
      series.watchStatus = WatchingStatus.WATCHING;
    }

    if (watchStatus === WatchingStatus.WATCHING) {
      series.watchStatus = WatchingStatus.WATCHED;
    }

    if (watchStatus === WatchingStatus.WATCHED) {
      series.watchStatus = WatchingStatus.NOT_WATCHING;
    }

    await this.seriesRepository.save(series);

    return series.watchStatus;
  }

  public async delete(series: Series) {
    return this.seriesRepository.remove(series);
  }

  public async deketeById(id: number) {
    const series = await this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id: id } });

    const subPromises = (series.subgroups || []).map((sub) => this.subgroupService.delete(sub));

    await Promise.all(subPromises);

    return this.delete(series);
  }

  public async findBySeason(name: string, year: number, sortBy: 'QUEUE' | 'NAME' | 'WATCH_STATUS' = 'QUEUE') {
    const series = (await this.seasonService.find(name as SeasonName, year))?.series ?? [];

    return series.sort((a, b) => {
      if (sortBy === 'QUEUE') {
        return b.showQueue.length - a.showQueue.length;
      }

      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === 'WATCH_STATUS') {
        return a.watchStatus.localeCompare(b.watchStatus);
      }
    });
  }

  public async findAll(overrideSeason?: string, overrideYear?: number) {
    const series = await this.seriesRepository.find({ relations: ['season', 'subgroups', 'subgroups.rules'] });
    const currentYear = await this.settingsService.findByKey('currentYear');
    const currentSeason = await this.settingsService.findByKey('currentSeason');

    return series.filter((found) => found.season.name === overrideSeason || (currentSeason.value && found.season.year === (overrideYear || Number(currentYear.value))));
  }

  public async findById(seriesId: number) {
    return this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id: seriesId } });
  }

  public async searchByMALSeason(seasonName: SeasonName, year: number) {
    const newSeason = await this.seasonService.find(seasonName, year);
    const season = await Season.anime(year, seasonName);

    const hasEps = (eps = 0) => eps === 0 || eps > 4;

    const promisedSeries = await Promise.all(season.anime.map((anime) => this.createFromMALSeason(anime, { autoMatchFolders: false })));

    return promisedSeries.filter((show) => !show.continuing && hasEps(show.numberOfEpisodes) && differenceInCalendarYears(new Date(), show.airingData) < 1);
  }

  public async createFromMALSeason(animeModel: AnimeSeason, options: { autoMatchFolders: boolean }) {
    const series = new Series();

    series.airingData = new Date(animeModel.airing_start) || new Date();
    series.description = animeModel.synopsis;
    series.genres = animeModel?.genres?.map((genre) => genre.name) ?? [];
    series.imageUrl = animeModel.image_url;
    series.name = animeModel.title;
    series.otherNames = [];
    series.numberOfEpisodes = animeModel.episodes || 0;
    series.score = animeModel.score;
    series.studio = animeModel.licensors?.join(' ') ?? '';
    series.continuing = animeModel.continuing;
    series.tags = [];
    series.watchStatus = WatchingStatus.THREE_RULE;

    if (options.autoMatchFolders) {
      series.folderPath = await this.animeFolderService.autoMakeFolder(series.name);
    }

    return series;
  }

  public async createFromMAL(animeModel: AnimeById, options?: { autoMatchFolders: boolean }) {
    const series = new Series();

    series.airingData = new Date(animeModel?.aired?.from ?? new Date()) || new Date();
    series.description = animeModel.synopsis;
    series.genres = animeModel?.genres?.map((genre) => genre.name) ?? [];
    series.imageUrl = animeModel.image_url;
    series.name = animeModel.title;
    series.otherNames = [animeModel.title_english, animeModel.title_japanese, ...(animeModel?.title_synonyms ?? [])];
    series.numberOfEpisodes = animeModel.episodes || 0;
    series.score = animeModel.score;
    series.studio = animeModel?.studios?.map(({ name }) => name).join(' ') ?? '';
    series.tags = [];
    series.watchStatus = WatchingStatus.THREE_RULE;
    series.malId = animeModel.mal_id;

    if (options?.autoMatchFolders) {
      series.folderPath = await this.animeFolderService.autoMakeFolder(series.name);
    }

    return series;
  }
}
