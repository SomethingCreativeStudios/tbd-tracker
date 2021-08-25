import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInCalendarYears } from 'date-fns';
import sanitize from 'sanitize-filename';

import { Series, WatchingStatus } from './models';
import { SeriesRepository } from './series.repository';
import { Anime, Season } from '../../jikan';
import { SeasonService } from '../season/season.service';

import { SubGroupService } from '../sub-group';
import { SeasonName } from '../season/models';
import { SettingsService } from '../settings/settings.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { createFromMAL, createFromMALSeason, findFromMAL } from './helpers/mal-helpers';
import { CreateFromMalDTO } from './dtos/CreateFromMalDTO';
import { UpdateSeriesDTO } from './dtos/UpdateSeriesDTO';
import { CreateBySeasonDTO } from './dtos/CreateBySeasonDTO';
import { SearchBySeasonDTO } from './dtos/SearchBySeasonDTO';
import { Seasons } from 'jikants/dist/src/interfaces/season/Season';
import { MalSearchDTO } from './dtos/MalSearchDTO';

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

  public async createFromSeason({ malIds, seasonName, seasonYear }: CreateBySeasonDTO) {
    return Promise.all(malIds.map((id) => this.createFromMALId({ seasonName, seasonYear, malId: id })));
  }

  public async syncImage(id: number) {
    const series = await this.seriesRepository.findOne({ id });
    const currentFolder = await this.animeFolderService.getCurrentFolder();
    const malSeries = await createFromMAL(await Anime.byId(series.malId), currentFolder, { autoMatchFolders: false });

    await this.seriesRepository.update({ id }, { imageUrl: malSeries.imageUrl });

    return malSeries.imageUrl;
  }

  public async syncWithMal(id: number) {
    const series = await this.seriesRepository.findOne({ id });
    const currentFolder = await this.animeFolderService.getCurrentFolder();
    const malSeries = await createFromMAL(await Anime.byId(series.malId), currentFolder, { autoMatchFolders: false });

    await this.seriesRepository.update({ id }, { airingData: malSeries.airingData, description: malSeries.description, numberOfEpisodes: malSeries.numberOfEpisodes, score: malSeries.score });

    return this.seriesRepository.findOne({ id });
  }

  public async create(series: Series) {
    await this.animeFolderService.ensureShowFolder(series.name, series.season.name, String(series.season.year));

    series.folderPath = sanitize(series.name);
    return this.seriesRepository.save(series);
  }

  public async createFromMALId(createModel: CreateFromMalDTO) {
    const currentFolder = await this.animeFolderService.getCurrentFolder();
    const series = await createFromMAL(await Anime.byId(createModel.malId), currentFolder, { autoMatchFolders: createModel.autoMatchFolders ?? true });

    const defaultSeason = createModel.seasonName || (await this.settingsService.findByKey('currentSeason')).value;
    const defaultYear = createModel.seasonYear || (await this.settingsService.findByKey('currentYear')).value;

    series.season = await this.seasonService.find(defaultSeason as SeasonName, Number(defaultYear));
    return this.create(series);
  }

  public async update(updateModel: UpdateSeriesDTO) {
    if (updateModel.downloaded > 3 && updateModel.watchStatus === WatchingStatus.THREE_RULE) {
      updateModel.watchStatus = WatchingStatus.WATCHING;
    }

    if (updateModel.downloaded === updateModel.numberOfEpisodes && updateModel.numberOfEpisodes > 1 && updateModel.watchStatus === WatchingStatus.WATCHING) {
      updateModel.watchStatus = WatchingStatus.WATCHED;
    }

    await this.seriesRepository.update({ id: updateModel.id }, updateModel);

    return this.seriesRepository.findOne({ id: updateModel.id });
  }

  public async toggleWatchStatus(id: number) {
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

    await this.seriesRepository.update({ id }, { watchStatus: series.watchStatus });

    return series.watchStatus;
  }

  public async deleteById(id: number) {
    const series = await this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id } });

    const subPromises = (series.subgroups || []).map((sub) => this.subgroupService.delete(sub.id));

    await Promise.all(subPromises);

    return this.seriesRepository.delete(series.id);
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

  public async searchByMALSeason({ season, year }: MalSearchDTO) {
    const foundSeason = await Season.anime(year, season);
    const currentFolder = await this.animeFolderService.getCurrentFolder();

    const hasEps = (eps = 0) => eps === 0 || eps > 4;

    const promisedSeries = await Promise.all(foundSeason.anime.map((anime) => createFromMALSeason(anime, currentFolder, { autoMatchFolders: false })));

    return promisedSeries.filter((show) => !show.continuing && hasEps(show.numberOfEpisodes) && differenceInCalendarYears(new Date(), show.airingData) < 1);
  }

  public async findFromMAL(name: string) {
    const currentFolder = await this.animeFolderService.getCurrentFolder();
    return findFromMAL(name, currentFolder);
  }
}
