import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isAfter } from 'date-fns';
import sanitize from 'sanitize-filename';

import { getClosestAiringDate } from '~/utlis/time-helpers';

import { Series, WatchingStatus } from './models';
import { SeriesRepository } from './series.repository';
import { SeasonService } from '../season/season.service';

import { SubGroupService } from '../sub-group';
import { SeasonName } from '../season/models';
import { SettingsService } from '../settings/settings.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { CreateFromMalDTO } from './dtos/CreateFromMalDTO';
import { UpdateSeriesDTO } from './dtos/UpdateSeriesDTO';
import { CreateBySeasonDTO } from './dtos/CreateBySeasonDTO';
import { MalSearchDTO } from './dtos/MalSearchDTO';
import { MigrateSeriesDTO } from './dtos/MigrateSeriesDTO';
import { NyaaItem } from '../nyaa/models/nyaaItem';
import { SubGroup } from '../sub-group/models';
import { MalService } from '../mal/mal.service';
import { IgnoreLinkService } from '../ignore-link/ignore-link.service';
import { SyncResultsDTO } from './dtos/SyncResultsDTO';
import { readdirSync, statSync } from 'fs-extra';
import { join } from 'path';
import { CreateSubGroupRuleDTO } from '../sub-group-rule/dtos/CreateSubGroupRuleDTO';
import { CreateSubGroupDTO } from '../sub-group/dtos/CreateSubGroupDTO';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';
import { ExportResultDTO } from './dtos/ExportResultDTO';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: SeriesRepository,

    @Inject(forwardRef(() => SubGroupService))
    private subgroupService: SubGroupService,

    @Inject(forwardRef(() => SubGroupRuleService))
    private subgroupRuleService: SubGroupRuleService,

    @Inject(forwardRef(() => SeasonService))
    private seasonService: SeasonService,

    @Inject(SettingsService)
    private readonly settingsService: SettingsService,

    @Inject(forwardRef(() => AnimeFolderService))
    private readonly animeFolderService: AnimeFolderService,

    private readonly malService: MalService,
    private readonly ignoreLinkService: IgnoreLinkService,
  ) {}

  public async createFromSeason({ malIds, seasonName, seasonYear, folderMap }: CreateBySeasonDTO) {
    const newSeries = [] as Series[];
    for await (const id of malIds) {
      const createdSeries = await this.createFromMALId({ seasonName, seasonYear, malId: id, autoMatchFolders: !!folderMap });
      createdSeries.folderPath = createdSeries.folderPath ?? folderMap[id];
      newSeries.push(createdSeries);
    }

    console.log('created series', newSeries.length);
    return newSeries;
  }

  public async syncImage(id: number) {
    const series = await this.seriesRepository.findOne({ where: { id } });
    const malSeries = await this.malService.findById(series.malId);

    await this.seriesRepository.update({ id }, { imageUrl: malSeries.imageUrl });

    return malSeries.imageUrl;
  }

  public async syncWithMal(id: number) {
    const series = await this.seriesRepository.findOne({ where: { id } });
    const malSeries = await this.malService.findById(series.malId);

    await this.seriesRepository.update({ id }, { imageUrl: malSeries.imageUrl, airingData: malSeries.airingData, description: malSeries.description, numberOfEpisodes: malSeries.numberOfEpisodes });

    return this.seriesRepository.findOne({ where: { id } });
  }

  public async syncAllWithMal() {
    const season = await this.settingsService.findByKey('currentSeason');
    const year = await this.settingsService.findByKey('currentYear');

    const series = await this.seasonService.find(season.value as SeasonName, Number(year.value));

    for await (const show of series.series) {
      console.log('syncing', show.name);
      await this.syncWithMal(show.id);
    }

    console.log('done mal sync');
  }

  public async create(series: Series) {
    await this.animeFolderService.ensureShowFolder(series.name, series.season.name, String(series.season.year));

    series.folderPath = sanitize(series.name);
    return this.seriesRepository.save(series);
  }

  public async createFromMALId(createModel: CreateFromMalDTO) {
    const series = await this.malService.findById(createModel.malId, createModel.autoMatchFolders ?? true);

    const defaultSeason = createModel.seasonName || (await this.settingsService.findByKey('currentSeason')).value;
    const defaultYear = createModel.seasonYear || (await this.settingsService.findByKey('currentYear')).value;

    series.season = await this.seasonService.find(defaultSeason as SeasonName, Number(defaultYear));
    return this.create(series);
  }

  public async update(updateModel: UpdateSeriesDTO) {
    if (updateModel.downloaded > 3 && updateModel.watchStatus === WatchingStatus.THREE_RULE) {
      updateModel.watchStatus = WatchingStatus.WATCHING;
    }

    if (updateModel.downloaded === updateModel.numberOfEpisodes && updateModel.numberOfEpisodes > 1) {
      updateModel.watchStatus = WatchingStatus.WATCHED;
    }

    if (updateModel.score) {
      const foundSeries = await this.seriesRepository.findOne({ where: { id: updateModel.id } });
      const canUpdateScore = updateModel.watchStatus === WatchingStatus.WATCHED || foundSeries.watchStatus === WatchingStatus.WATCHED;
      canUpdateScore && (await this.malService.updateScore(foundSeries.malId, updateModel.score, foundSeries.numberOfEpisodes));
    }

    await this.seriesRepository.update({ id: updateModel.id }, updateModel);

    const test = await this.seriesRepository.findOne({ where: { id: updateModel.id } });

    return test;
  }

  public async addSubGroup(seriesId: number, subGroup: CreateSubGroupDTO, rule: CreateSubGroupRuleDTO) {
    const newGroup = await this.subgroupService.create({ ...subGroup, seriesId });
    const newRule = await this.subgroupRuleService.createMany({ ...rule, subgroupId: newGroup.id });
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

  public async findBySeason(name: string, year: number, _sortBy: 'QUEUE' | 'NAME' | 'WATCH_STATUS' = 'QUEUE', onlyWithQueue: boolean) {
    const ignoreLinks = await this.ignoreLinkService.findAll();
    const seasonSeries = (await this.seasonService.find(name as SeasonName, year))?.series ?? [];
    const fileMap = {};

    for await (const show of seasonSeries) {
      fileMap[show.folderPath] = await this.mostRecentFile(show.folderPath, name, year + '');
    }

    const series = (seasonSeries ?? []).map((show) => ({
      ...show,
      nextAiringDate: getClosestAiringDate(show.airingData, fileMap[show.folderPath]),
    }));

    const filteredQueue = (items: NyaaItem[], groups: SubGroup[]) =>
      items.filter((item) => {
        return groups.every((group) => group.preferedResultion === item.resolution) && !ignoreLinks.some((ignore) => ignore.link === item.downloadLink);
      });

    const waitingToBeScored = (show: Series) => {
      // @ts-ignore
      return show.downloaded === show.numberOfEpisodes && (!show.score || show.score === 'NaN');
    };

    const sortedSeries = series.sort((a, b) => {
      const aQueue = filteredQueue(a.showQueue, a.subgroups);
      const bQueue = filteredQueue(b.showQueue, b.subgroups);

      if (aQueue.length === bQueue.length) {
        if (isAfter(a.nextAiringDate, b.nextAiringDate)) return 1;
        if (!isAfter(a.nextAiringDate, b.nextAiringDate)) return -1;
      }

      if (aQueue.length > bQueue.length) return -1;
      if (aQueue.length < bQueue.length) return 1;
    });

    return onlyWithQueue ? sortedSeries.filter((show) => waitingToBeScored(show) || filteredQueue(show.showQueue, show.subgroups).length) : sortedSeries;
  }

  public async findAll(overrideSeason?: string, overrideYear?: number) {
    const series = await this.seriesRepository.find({ relations: ['season', 'subgroups', 'subgroups.rules'] });
    const currentYear = await this.settingsService.findByKey('currentYear');
    const currentSeason = await this.settingsService.findByKey('currentSeason');

    const fileMap = {};

    for await (const show of series) {
      fileMap[show.folderPath] = await this.mostRecentFile(show.folderPath, currentSeason.value, currentYear.value + '');
    }

    return series
      .filter((found) => found.season.name === overrideSeason || (currentSeason.value && found.season.year === (overrideYear || Number(currentYear.value))))
      .map((series) => ({ ...series, nextAiringDate: getClosestAiringDate(series.airingData, fileMap[series.folderPath]) }));
  }

  public async findById(seriesId: number) {
    const series = await this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id: seriesId } });

    return { ...series, nextAiringDate: getClosestAiringDate(series.airingData, await this.mostRecentFile(series.folderPath)) };
  }

  public async searchByMALSeason({ season, year }: MalSearchDTO) {
    return (await this.malService.searchSeason(year + '', season)).filter((series) => !series.continuing);
  }

  public async findFromMAL(name: string) {
    return this.malService.search(name);
  }

  public async findAllFromMAL(names: string[]) {
    const results = [];
    for await (const name of names) {
      try {
        results.push(await this.malService.search(name, false));
      } catch (e) {
        console.log('Show has probs', name);
      }
    }
    console.log(results);
  }

  public async completeSeries(seriesId: number, score: number) {
    const series = await this.findById(seriesId);

    await this.malService.updateScore(series.malId, score, series.numberOfEpisodes);

    return this.update({ id: seriesId, score });
  }

  public async migrateSeries({ id, season, year }: MigrateSeriesDTO) {
    const foundSeries = await this.findById(id);
    const foundSeason = await this.seasonService.find(season, year);
    const currentSeason = foundSeries.season;

    foundSeries.season = foundSeason;

    await this.seriesRepository.save(foundSeries);

    await this.animeFolderService.migrateSeries(foundSeries.folderPath, currentSeason.name, currentSeason.year, foundSeason.name, foundSeason.year);

    return true;
  }

  public async syncWithLocalSeason(): Promise<SyncResultsDTO[]> {
    const season = await this.settingsService.findByKey('currentSeason');
    const year = await this.settingsService.findByKey('currentYear');

    const folders = await this.animeFolderService.getFolders(season.value, year.value);
    const series = await this.findBySeason(season.value, +year.value, 'NAME', false);
    const newSeries = folders.filter((folder) => {
      return !series.find((show) => show.folderPath.endsWith(folder));
    });

    const results = await Promise.all(newSeries.map((name) => this.syncWithLocal(name)));

    return results;
  }

  public async exportAll(): Promise<ExportResultDTO[]> {
    const series = await this.seriesRepository.find({ relations: ['season', 'subgroups', 'subgroups.rules'] });

    return series.map((show) => {
      return {
        malId: show.malId + '',
        altNames: show.otherNames.join(','),
        tags: show.tags.join(','),
        downloaded: show.downloaded,
        folderName: show.folderPath,
        overrideName: show.showName,
        countRegex: show.episodeRegex,
        overrideOffset: show.offset,
        subgroupName: show.subgroups[0]?.name,
        ruleType: show.subgroups?.[0]?.rules[0]?.ruleType ?? '',
        ruleText: show.subgroups?.[0]?.rules[0]?.text ?? '',
        seasonName: show.season.name,
        seasonYear: show.season.year,
      };
    });
  }

  private async syncWithLocal(folderName: string): Promise<SyncResultsDTO> {
    const result = new SyncResultsDTO();

    result.folderName = folderName;

    const malResults = await this.malService.search(folderName, false, 10);

    result.options = malResults.map((malResult) => ({ malId: malResult.malId, name: malResult.name, description: malResult.description, imagePath: malResult.imageUrl }));

    return result;
  }

  private async mostRecentFile(folderName, season?: string, year?: string, offset = 0) {
    try {
      const files = readdirSync(join(await this.animeFolderService.getCurrentFolder(season, year), folderName), { withFileTypes: true }).filter((item) => item.isFile());

      return files.reduce((acc, file) => {
        const birthDay = statSync(join(file.path, file.name)).birthtime;
        return isAfter(birthDay, acc) ? birthDay : acc;
      }, new Date('1970-01-01T00:00:00.000Z'));
    } catch (e) {
      return null;
    }
  }
}
