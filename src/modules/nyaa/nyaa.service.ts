import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readdirSync, rename } from 'fs-extra';
import { clone, uniqWith } from 'ramda';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { resolve, join } from 'path';

import Parser from 'rss-parser';
import WebTorrent from 'webtorrent';

import { SubGroup } from '../sub-group/models';
import { SubGroupService } from '../sub-group';
import { NyaaRSSItem } from './models/nyaaRSSItem';
import { NyaaItem } from './models/nyaaItem';
import { SocketService } from '../socket/socket.service';
import { SeriesService } from '../series/series.service';
import { SeasonName } from '../season/models';
import { Series } from '../series/models';
import { SettingsService } from '../settings/settings.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { RuleType, SubGroupRule } from '../sub-group-rule/models';
import { findLastSeason } from '../season/helpers/season-helper';

@Injectable()
export class NyaaService {
  private parser: Parser = new Parser();
  private client: WebTorrent.Instance;

  private activeTorrents: string[] = [];
  private downloadingTorrents: { path: string; hash: string; name: string; url: string; fileName: string; id: number }[] = [];
  private queuedTorrents: { path: string; url: string; fileName: string; id: number }[] = [];

  constructor(
    private readonly subgroupService: SubGroupService,
    private readonly seriesService: SeriesService,
    private readonly socketService: SocketService,
    private readonly settingsService: SettingsService,
    private readonly folderService: AnimeFolderService,
  ) {
    this.client = new WebTorrent();

    this.client.on('error', (err) => {
      console.error(err);

     this.client = new WebTorrent();
    });

  }

  public onConnect(socket: Socket) {
    this.downloadingTorrents.forEach((torrent) => {
      socket.emit('start-downloading', { hash: torrent.hash, value: { name: torrent.name, url: torrent.url, queued: false } });
    });

    this.queuedTorrents.forEach((torrent) => {
      console.log('sending', torrent);
      socket.emit('torrent-queued', { url: torrent.path, fileName: torrent.fileName });
    });
  }

  public findOverrideName(showName: string, offset: number, currentName: string) {
    if (!showName && !offset) {
      return currentName;
    }

    const epNumber = this.findCount(currentName) + (offset || 0);
    const subgroup =
      currentName
        .match(/\[(.*?)\]/g)?.[0]
        ?.replace('[', '')
        .replace(']', '') ?? '';

    return showName ? `[${subgroup}] ${showName} - ${epNumber}.mkv` : currentName.replace(`- ${this.findCount(currentName)}`, `- ${epNumber}`);
  }

  public async searchItems(feed: NyaaFeed, searchTerm: string, onlyTrusted = false): Promise<NyaaItem[]> {
    try {
      const trusted = onlyTrusted ? '&f=2' : '';
      const query = `&q=${encodeURI(searchTerm)}`;

      console.log(`${feed}${trusted}${query}`);

      const { items = [] } = (await this.tryToParse(`${feed}${trusted}${query}`, 1, 3)) || {};

      return (items as NyaaRSSItem[]).map((item) => {
        return {
          downloadLink: item.link,
          publishedDate: new Date(item.isoDate),
          itemName: item.title.replace(':', ''),
          episodeName: this.findCount(item.title),
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

  public findValidItems(items: NyaaItem[], groups: SubGroup[]) {
    return items.filter((item) => this.isValidItem(item, groups));
  }

  public isValidItem(item: NyaaItem, groups: SubGroup[]) {
    const validSubgroups = groups.filter((group) => group.name.trim().toLowerCase() === item.subGroupName.trim().toLowerCase());

    if (validSubgroups.length === 0) {
      return false;
    }

    return validSubgroups.some((group) => this.subgroupService.matchesSubgroup(item.itemName.trim(), group));
  }

  public async testDownload() {
    const paths = [
      { name: 'test1', url: '1111', id: 0 },
      { name: 'test2', url: '2222', id: 1 },
      { name: 'test3', url: '3333', id: 2 },
    ];

    for (let i = 0; i < paths.length; i++) {
      const { name, url, id } = paths[i];
      if (i <= 1) {
        this.testAddTorrent(url, resolve(process.env.BASE_FOLDER, name), name, id);
      } else {
        console.log('Queued', name);
        this.queuedTorrents.push({ path: resolve(process.env.BASE_FOLDER, name), id: 0, fileName: name, url });
        this.socketService.nyaaSocket.emit('torrent-queued', { url, fileName: name });
      }
    }
  }

  public async downloadShow(
    torrentName: string = 'https://nyaa.si/download/1284378.torrent',
    downloadPath: string,
    fileName: string,
    seriesId: number,
    queuedName?: string,
  ): Promise<{ error?: string; name: string; files: WebTorrent.TorrentFile[] }> {
    try {
      console.log('Getting', torrentName, downloadPath);

      if (this.activeTorrents.some((torrent) => torrent === torrentName)) {
        console.log('Can not add dups');
        return;
      }

      console.log('Torrents downloading', this.downloadingTorrents.length);
      if (this.downloadingTorrents.length >= 4) {
        console.log('Queued', fileName || queuedName);
        this.queuedTorrents.push({ fileName: fileName || queuedName, path: downloadPath, url: torrentName, id: seriesId });

        this.socketService.nyaaSocket.emit('torrent-queued', { fileName: fileName || queuedName, url: torrentName });
        return;
      }

      this.addTorrent(torrentName, downloadPath, fileName, seriesId, false);
    } catch (ex) {
      console.error(ex);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  public async syncShowsCron() {
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
      await this.seriesService.syncWithMal(show.id);
      await this.syncShow(show, season, year);
    }
  }

  public async syncById(id: number) {
    const foundSeries = await this.seriesService.findById(id);
    const { name, year } = foundSeries.season;

    await this.syncShow(foundSeries, name, year + '');
  }

  public async suggestSubgroups(name: string, altNames: string[]) {
    const items = await this.searchItems(NyaaFeed.ANIME, name, false);
    const altItems = await Promise.all(altNames.map((alt) => this.searchItems(NyaaFeed.ANIME, alt, false)));

    const unqiItems = this.uniqNyaaItems(items.concat(...altItems));

    return unqiItems.map((nyatem) => {
      const subGroup = new SubGroup();

      subGroup.name = nyatem.subGroupName;
      // @ts-ignore
      subGroup.preferedResultion = nyatem.resolution;

      const rule = new SubGroupRule();
      rule.ruleType = RuleType.STARTS_WITH;
      rule.isPositive = true;
      rule.text = this.findSearchTerm(nyatem);

      subGroup.addRule(rule);

      return subGroup;
    });
  }

  private async syncShow(series: Series, season?: string, year?: string) {
    this.socketService.nyaaSocket.emit('series-syncing', { id: series.id, type: 'STARTING' });
    await this.folderService.ensureShowFolder(series.folderPath, season, year);
    const downloadedEps = series.folderPath ? await this.findDownloadedEps(series.folderPath, season, year) : [];
    const currentCount = series.folderPath ? await this.findHighestCount(series.folderPath, season, year) : series.downloaded;
    const existingQueue = clone(series.showQueue);

    const searchItems = this.findSearchItems(series);
    const items = await Promise.all(searchItems.map((name) => this.searchItems(NyaaFeed.ANIME, name, false)));
    const uniqItems = this.uniqNyaaItems([].concat(...items));

    const validItems = this.findValidItems(
      (uniqItems || []).filter((item) => !downloadedEps.includes(item.episodeName + series.offset)),
      series.subgroups,
    );

    series.showQueue = validItems;
    series.downloaded = series.downloaded > currentCount ? series.downloaded : currentCount;

    await this.seriesService.update({ id: series.id, downloaded: series.downloaded, showQueue: series.showQueue });

    const queueUpdated = existingQueue.every((item) => validItems.includes(item));
    const didUpdateOccur = !queueUpdated || existingQueue.length !== validItems.length;

    this.socketService.nyaaSocket.emit('series-syncing', {
      id: series.id,
      type: didUpdateOccur ? 'UPDATE_FOUND' : 'NO_UPDATE',
      queue: validItems,
    });

    await this.waitFor(400);
  }

  private findSearchItems({ subgroups = [] }: Series) {
    return subgroups.reduce((acc, subgroup) => {
      const { rules = [] } = subgroup;
      const names = rules.map(rule => rule.isPositive ? rule.text : '').filter(Boolean);
      return acc.concat(names);
    }, [] as string[]);
  }

  private addTorrent(url: string, downloadPath: string, fileName: string, seriesId: number, queued: boolean = false) {
    this.activeTorrents.push(url);
    this.downloadingTorrents.push({ path: downloadPath, url, hash: '', name: downloadPath, id: seriesId, fileName });

    this.client.on('error', function (err) { console.log('Error', err) })

    this.client.add(url, { path: downloadPath, maxWebConns: 100 }, (torrent) => {
      const realName = fileName || torrent.name;
      console.log('Client is downloading:', torrent.infoHash, realName);
      this.downloadingTorrents.forEach((tor) => (tor.url === url ? { ...tor, name: realName, hash: torrent.infoHash } : tor));

      this.socketService?.nyaaSocket?.emit('start-downloading', { hash: torrent.infoHash, value: { name: realName, id: seriesId, url, queued } });
      this.socketService?.nyaaSocket?.emit('metadata', { hash: torrent.infoHash, value: { name: realName, id: seriesId } });

      torrent.on('done', async () => {
        console.log('torrent finished downloading', torrent.infoHash, realName);
        this.socketService?.nyaaSocket?.emit('downloaded', { hash: torrent.infoHash, name: realName, value: true, id: seriesId });

        const foundTorrentIndex = this.downloadingTorrents.findIndex((item) => item.url === url);

        if (fileName) {
          rename(join(downloadPath, torrent.name), join(downloadPath, fileName));
        }

        this.downloadingTorrents = this.downloadingTorrents.slice(foundTorrentIndex);

        console.log('Syncing', seriesId);
        this.syncById(seriesId);

        setTimeout(() => torrent.destroy(), 100);
        const next = this.queuedTorrents.shift();

        if (next) {
          console.log('Adding new torrent', next.path);
          this.addTorrent(next.url, next.path, next.fileName, next.id, true);
        }

        clearInterval(interval);
      });

      torrent.on('ready', function () {
        console.log('torrent metadata', realName);
        this.socketService?.nyaaSocket?.emit('metadata', { hash: torrent.infoHash, value: { name: realName, id: seriesId } });
      });

      const interval = setInterval(() => {
        this.socketService?.nyaaSocket?.emit('downloading', {
          hash: torrent.infoHash,
          value: {
            name: realName,
            justDownloaded: 100,
            totalDownloaded: torrent.downloaded,
            speed: torrent.downloadSpeed,
            progress: torrent.progress,
            timeLeft: this.millisecondsToTime(torrent.timeRemaining),
            ratio: torrent.ratio,
            id: seriesId,
          },
        });
      }, 1000);

      torrent.on('error', (message) => {
        console.log('torrent error', message.toString());
        this.socketService?.nyaaSocket?.emit('error', { hash: torrent.infoHash, value: message });
        this.downloadingTorrents.pop();
        clearInterval(interval);
      });
    });
  }

  private testAddTorrent(url: string, downloadPath: string, torrentName: string, seriesId: number, queued: boolean = false) {
    const randomNumer = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    const hash = uuidv4();

    this.activeTorrents.push(url);
    this.downloadingTorrents.push({ path: downloadPath, url, hash, name: torrentName, fileName: '', id: seriesId });

    console.log('Client is downloading:', hash, torrentName);

    this.socketService?.nyaaSocket?.emit('start-downloading', { hash, value: { name: torrentName, url, queued, id: seriesId } });
    this.socketService?.nyaaSocket?.emit('metadata', { hash, value: { name: torrentName, id: seriesId } });

    let totalDownloaded = 0;

    const timeout = setInterval(() => {
      const justDownloaded = randomNumer(10, 22);
      totalDownloaded += justDownloaded;

      this.socketService?.nyaaSocket?.emit('downloading', {
        hash,
        value: {
          justDownloaded,
          totalDownloaded,
          name: torrentName,
          speed: 1000,
          progress: totalDownloaded / 100,
        },
      });

      if (totalDownloaded >= 100) {
        clearInterval(timeout);
        this.socketService?.nyaaSocket?.emit('downloaded', { hash, name: torrentName, value: true, id: seriesId });
        console.log('Done Downloaded', hash);

        this.downloadingTorrents.pop();

        const next = this.queuedTorrents.shift();

        if (next) {
          console.log('Adding new torrent', next.path);
          this.testAddTorrent(next.url, next.path, next.fileName, next.id, true);
        }
      }
    }, 1000);
  }

  private async findHighestCount(folderName, season?: string, year?: string, offset = 0) {
    const files = readdirSync(join(await this.folderService.getCurrentFolder(season, year), folderName), { withFileTypes: true }).filter((item) => item.isFile());

    return files.reduce((acc, file) => {
      const epNumber = this.findCount(file.name) + offset;

      return acc < epNumber ? epNumber : acc;
    }, 0);
  }

  private async findDownloadedEps(folderName, season?: string, year?: string, offset = 0) {
    const files = readdirSync(join(await this.folderService.getCurrentFolder(season, year), folderName), { withFileTypes: true }).filter((item) => item.isFile());

    return files.map((file) => this.findCount(file.name) + offset);
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

  private findCount(title: string) {
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

  private millisecondsToTime(milli) {
    var seconds = Math.floor((milli / 1000) % 60) ? Math.floor((milli / 1000) % 60) + ' seconds' : '';
    var minutes = Math.floor((milli / (60 * 1000)) % 60) ? Math.floor((milli / (60 * 1000)) % 60) + ' minutes ' : '';

    return minutes + seconds;
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
