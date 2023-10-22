import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readdirSync } from 'fs-extra';
import { clone, uniqWith } from 'ramda';
import { join } from 'path';
import Parser from 'rss-parser';

import { SubGroup } from '../sub-group/models';
import { SubGroupService } from '../sub-group';
import { NyaaRSSItem } from './models/nyaaRSSItem';
import { NyaaItem } from './models/nyaaItem';
import { SocketService } from '../socket/socket.service';
import { SeriesService } from '../series/series.service';
import { SeasonName } from '../season/models';
import { Series, WatchingStatus } from '../series/models';
import { SettingsService } from '../settings/settings.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { RuleType, SubGroupRule } from '../sub-group-rule/models';
import { findLastSeason } from '../season/helpers/season-helper';
import { TorrentService } from '../torrent/torrent.service';
import { ConfigService } from '~/config';
import { IgnoreLink } from '../ignore-link/models/ignore-link.entity';
import { SuggestedSubgroupDTO } from './dto/SuggestedSubgroupDTO';

@Injectable()
export class NyaaService {
  private parser: Parser = new Parser({ customFields: { item: ['nyaa:trusted', 'nyaa:remake'] } });

  constructor(
    private readonly subgroupService: SubGroupService,
    private readonly seriesService: SeriesService,
    private readonly socketService: SocketService,
    private readonly settingsService: SettingsService,
    private readonly folderService: AnimeFolderService,
    private readonly torrentService: TorrentService,
    private readonly configService: ConfigService,
  ) {}

  public findOverrideName(showName: string, offset: number, currentName: string, regex = '') {
    if (!showName && !offset) {
      return currentName;
    }

    const epNumber = this.findCount(currentName, regex) + (Number(offset) || 0);
    const subgroup =
      currentName
        .match(/\[(.*?)\]/g)?.[0]
        ?.replace('[', '')
        .replace(']', '') ?? '';

    return showName ? `[${subgroup}] ${showName} - ${epNumber}.mkv` : currentName.replace(`- ${this.findCount(currentName, regex)}`, `- ${epNumber}`);
  }

  public async searchItems(feed: NyaaFeed, searchTerm: string, epCountRegex = '', onlyTrusted = false): Promise<NyaaItem[]> {
    try {
      const trusted = onlyTrusted ? '&f=2' : '';
      const query = searchTerm ? `&q=${encodeURI(searchTerm)}` : '';

      console.log(`${feed}${trusted}${query}`);

      const { items = [] } = (await this.tryToParse(`${feed}${trusted}${query}`, 1, 3)) || {};

      return (items as NyaaRSSItem[]).map((item) => {
        return {
          downloadLink: item.link,
          publishedDate: new Date(item.isoDate),
          itemName: item.title.replace(':', ''),
          episodeName: this.findCount(item.title, epCountRegex),
          isRemake: item['nyaa:remake'] === 'Yes',
          isTrusted: item['nyaa:trusted'] === 'Yes',
          subGroupName:
            item.title
              .match(/\[(.*?)\]/g)?.[0]
              ?.replace('[', '')
              .replace(']', '') ?? '',
          resolution: this.findResolution(item.title),
        };
      });
    } catch (ex) {
      console.error(ex);
    }

    return [];
  }

  /**
   * Get all items in the specified feed
   * @param feed
   */
  public async fetchItems(feed: NyaaFeed): Promise<NyaaItem[]> {
    try {
      const { items = [] } = (await this.parser.parseURL(feed)) || {};

      return (items as NyaaRSSItem[]).map((item) => {
        return {
          downloadLink: item.link,
          publishedDate: new Date(item.isoDate),
          itemName: item.title,
          episodeName: this.findCount(item.title),
          isRemake: item['nyaa:remake'] === 'Yes',
          isTrusted: item['nyaa:trusted'] === 'Yes',
          subGroupName:
            item.title
              .match(/\[(.*?)\]/g)?.[0]
              ?.replace('[', '')
              .replace(']', '') ?? '',
          resolution: this.findResolution(item.title),
        };
      });
    } catch (ex) {
      console.error(ex);
    }

    return [];
  }

  public findValidItems(items: NyaaItem[], groups: SubGroup[], ignoreLinks: IgnoreLink[]) {
    return items.filter((item) => this.isValidItem(item, groups, ignoreLinks));
  }

  public isValidItem(item: NyaaItem, groups: SubGroup[], ignoreLinks: IgnoreLink[]) {
    const validSubgroups = groups.filter((group) => group.name.trim().toLowerCase() === item.subGroupName.trim().toLowerCase());

    if (validSubgroups.length === 0) {
      return false;
    }

    if (ignoreLinks.some((link) => link.link === item.downloadLink)) {
      return false;
    }

    return validSubgroups.some((group) => this.subgroupService.matchesSubgroup(item.itemName.trim(), group));
  }

  public async syncCurrentShows() {
    const defaultSeason = (await this.settingsService.findByKey('currentSeason')).value;
    const defaultYear = (await this.settingsService.findByKey('currentYear')).value;

    const { season, year } = findLastSeason(defaultSeason as SeasonName, defaultYear);

    await this.syncShows();
    await this.syncShows(season, year + '');
  }

  public async syncShows(season?: string, year?: string) {
    const defaultSeason = season || (await this.settingsService.findByKey('currentSeason')).value;
    const defaultYear = year || (await this.settingsService.findByKey('currentYear')).value;

    const series = await this.seriesService.findBySeason(defaultSeason as SeasonName, Number(defaultYear), 'QUEUE', false);

    for await (const show of series) {
      try {
        await this.seriesService.syncWithMal(show.id);
        await this.syncShow(show, season, year);
      } catch (ex) {
        console.log('Error syncing show', show.name);
      }
    }
  }

  public async syncById(id: number) {
    const foundSeries = await this.seriesService.findById(id);
    const { name, year } = foundSeries.season;

    await this.syncShow(foundSeries, name, year + '');
  }

  public async suggestFromMostRecent() {
    const items = await this.searchItems(NyaaFeed.ANIME, '', '', false);
    const suggestions = items
      .sort((a, b) => (a.publishedDate > b.publishedDate ? 1 : -1))
      .map((nyatem) => {
        const suggestedSubgroup = new SuggestedSubgroupDTO();
        const subGroup = new SubGroup();

        subGroup.name = nyatem.subGroupName;
        // @ts-ignore
        subGroup.preferedResultion = nyatem.resolution;

        const rule = new SubGroupRule();
        rule.ruleType = RuleType.STARTS_WITH;
        rule.isPositive = true;
        rule.text = this.findSearchTerm(nyatem);

        subGroup.addRule(rule);

        suggestedSubgroup.subgroup = subGroup;
        suggestedSubgroup.isRemake = nyatem.isRemake;
        suggestedSubgroup.isTrusted = nyatem.isTrusted;
        suggestedSubgroup.pubDate = nyatem.publishedDate;
        suggestedSubgroup.title = nyatem.itemName;

        return suggestedSubgroup;
      })
      .filter((suggestion) => suggestion.subgroup.preferedResultion === '1080' && suggestion.subgroup.name && suggestion.subgroup.rules?.[0].text);

    return suggestions.sort((a, b) => (a.isTrusted && !b.isTrusted ? -1 : 1));
  }

  public async suggestSubgroups(name: string, altNames: string[], epCountRegex = '') {
    const items = await this.searchItems(NyaaFeed.ANIME, name, epCountRegex, false);
    const altItems = await Promise.all(altNames.map((alt) => this.searchItems(NyaaFeed.ANIME, alt, epCountRegex, false)));

    const unqiItems = this.uniqNyaaItems(items.concat(...altItems));

    const suggestions = unqiItems
      .sort((a, b) => (a.publishedDate > b.publishedDate ? 1 : -1))
      .map((nyatem) => {
        const suggestedSubgroup = new SuggestedSubgroupDTO();
        const subGroup = new SubGroup();

        subGroup.name = nyatem.subGroupName;
        // @ts-ignore
        subGroup.preferedResultion = nyatem.resolution;

        const rule = new SubGroupRule();
        rule.ruleType = RuleType.STARTS_WITH;
        rule.isPositive = true;
        rule.text = this.findSearchTerm(nyatem);

        subGroup.addRule(rule);

        suggestedSubgroup.subgroup = subGroup;
        suggestedSubgroup.isRemake = nyatem.isRemake;
        suggestedSubgroup.isTrusted = nyatem.isTrusted;
        suggestedSubgroup.pubDate = nyatem.publishedDate;

        return suggestedSubgroup;
      })
      .filter((suggestion) => suggestion.subgroup.preferedResultion === '1080' && !!suggestion.subgroup.name);

    const uniqSuggestions = uniqWith<SuggestedSubgroupDTO, SuggestedSubgroupDTO>((a, b) => a.subgroup.name === b.subgroup.name, suggestions);

    return uniqSuggestions.sort((a, b) => (a.isTrusted && !b.isTrusted ? -1 : 1));
  }

  public async downloadShow(url: string, downloadPath: string, fileName: string, queuedName: string, id: number) {
    this.torrentService.download(
      url,
      downloadPath,
      fileName,
      queuedName,
      {
        onDone: (id) => {
          console.log('Syncing', id);
          this.syncById(+id);
        },
      },
      `${id}`,
    );
  }

  private async syncShow(series: Series, season?: string, year?: string) {
    if (series.watchStatus === WatchingStatus.WATCHED) {
      console.log('Skipping watched show', series.name);
      return;
    }

    if (series.subgroups.length === 0) {
      const approvedSubGroups = await this.settingsService.findByKey('approvedSubgroups');
      const suggestedSubgroups = await this.suggestSubgroups(series.name, series.otherNames, series.episodeRegex);
      const isReasonableDate = (date: Date) => series.airingData < date;
      const allGoodGroups = suggestedSubgroups.filter((suggestion) => isReasonableDate(suggestion.pubDate) && approvedSubGroups.value.toLowerCase().includes(suggestion.subgroup.name.toLowerCase()));

      await this.seriesService.update({ id: series.id, hasSubgroupsPending: allGoodGroups.length > 0 });

      this.socketService.nyaaSocket.emit('series-syncing', {
        id: series.id,
        type: 'PENDING',
        queue: allGoodGroups,
      });

      this.waitFor(400);
      return;
    }

    this.socketService.nyaaSocket.emit('series-syncing', { id: series.id, type: 'STARTING' });
    await this.folderService.ensureShowFolder(series.folderPath, season, year);

    const downloadedEps = series.folderPath ? await this.findDownloadedEps(series.folderPath, season, year) : [];
    const currentCount = series.folderPath ? await this.findHighestCount(series.folderPath, season, year) : series.downloaded;
    const existingQueue = clone(series.showQueue);

    const searchItems = this.findSearchItems(series);
    const items = await Promise.all(searchItems.map((name) => this.searchItems(NyaaFeed.ANIME, name, series.episodeRegex, false)));
    const uniqItems = this.uniqNyaaItems([].concat(...items));

    const validItems = this.findValidItems(
      (uniqItems || []).filter((item) => !downloadedEps.includes(item.episodeName + Number(series.offset || 0))),
      series.subgroups,
      [],
    );

    series.showQueue = validItems;
    series.downloaded = series.downloaded > currentCount ? series.downloaded : currentCount;

    await this.seriesService.update({ id: series.id, downloaded: series.downloaded, hasSubgroupsPending: false, numberOfEpisodes: series.numberOfEpisodes, showQueue: series.showQueue });

    const queueUpdated = existingQueue.every((item) => validItems.includes(item));
    const didUpdateOccur = !queueUpdated || existingQueue.length !== validItems.length;

    this.socketService.nyaaSocket.emit('series-syncing', {
      id: series.id,
      type: didUpdateOccur ? 'UPDATE_FOUND' : 'NO_UPDATE',
      queue: validItems,
    });

    await this.waitFor(400);
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async syncShowsCron() {
    if (!this.configService.enableSync) {
      return;
    }

    await this.syncCurrentShows();
  }

  private findSearchItems({ subgroups = [] }: Series) {
    return subgroups.reduce((acc, subgroup) => {
      const { rules = [] } = subgroup;
      const names = rules.map((rule) => (rule.isPositive ? rule.text : '')).filter(Boolean);
      return acc.concat(names);
    }, [] as string[]);
  }

  private async findHighestCount(folderName, season?: string, year?: string, offset = 0) {
    const files = readdirSync(join(await this.folderService.getCurrentFolder(season, year), folderName), { withFileTypes: true }).filter((item) => item.isFile());

    return files.reduce((acc, file) => {
      const epNumber = this.findCount(file.name) + (Number(offset) || 0);

      return acc < epNumber ? epNumber : acc;
    }, 0);
  }

  private async findDownloadedEps(folderName, season?: string, year?: string, offset = 0) {
    const files = readdirSync(join(await this.folderService.getCurrentFolder(season, year), folderName), { withFileTypes: true }).filter((item) => item.isFile());

    return files.map((file) => this.findCount(file.name) + (Number(offset) || 0));
  }

  private findResolution(title: string) {
    if (title.includes('720') || title.includes('720p')) {
      return '720';
    }

    if (title.includes('1080') || title.includes('1080p')) {
      return '1080';
    }

    if (title.includes('480') || title.includes('480p')) {
      return '480';
    }

    return 'ANY';
  }

  private findCount(title: string, regex = '') {
    if (regex) {
      const matches = title.match(new RegExp(regex, 'i'));
      if (matches) return Number(matches.length > 0 ? matches[matches.length - 1] : 0);
    }

    const parts = title.split(' - ');

    if (parts.length === 0) {
      return -1;
    }

    const matches = (parts[parts.length - 1].match(/\d+/) || [])[0] || '-1';

    return Number(matches);
  }

  public async waitFor(time: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(() => {});
      }, time);
    });
  }

  private async tryToParse(url: string, delay: number, max: number) {
    try {
      return await this.parser.parseURL(url);
    } catch (ex) {
      if (delay === max) {
        return { items: [] };
      }
      await this.waitFor(delay * 1000);
      return await this.tryToParse(url, delay + 1, max);
    }
  }

  private uniqNyaaItems(nyaaItems: NyaaItem[]) {
    return uniqWith<NyaaItem, NyaaItem>((a, b) => a.downloadLink === b.downloadLink, nyaaItems);
  }

  private findSearchTerm(item: NyaaItem) {
    const withOutGroup = item.itemName.replace('[' + item.subGroupName + ']', '');

    return withOutGroup.substring(0, withOutGroup.indexOf(' -'));
  }
}

export enum NyaaFeed {
  ANIME = 'https://nyaa.si/?page=rss&c=1_2',
  BOOKS = 'https://nyaa.si/?page=rss&c=3_1',
  MUSIC = 'https://nyaa.si/?page=rss&c=2_2&f=0',
}
