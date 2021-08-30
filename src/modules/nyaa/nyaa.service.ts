import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readdirSync } from 'fs-extra';
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
import { ConfigService } from '../../config';
import { SettingsService } from '../settings/settings.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { RuleType, SubGroupRule } from '../sub-group-rule/models';

@Injectable()
export class NyaaService {
  private parser: Parser = new Parser();
  private client: WebTorrent.Instance;
  private activeTorrents: string[] = [];
  private downloadingTorrents: { path: string; hash: string; name: string; url: string }[] = [];
  private queuedTorrents: { path: string; url: string; fileName: string }[] = [];

  constructor(
    private readonly subgroupService: SubGroupService,
    private readonly seriesService: SeriesService,
    private readonly socketService: SocketService,
    private readonly settingsService: SettingsService,
    private readonly folderService: AnimeFolderService,
  ) {
    this.client = new WebTorrent();
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

  public findFileNameBySeries(series: Series, currentName: string) {
    if (!series.showName && !series.offset) {
      return currentName;
    }

    const epNumber = this.findCount(currentName) + (series.offset || 0);
    const subgroup =
      currentName
        .match(/\[(.*?)\]/g)?.[0]
        ?.replace('[', '')
        .replace(']', '') ?? '';

    return series.showName ? `[${subgroup}] ${series.showName} - ${epNumber}.mkv` : currentName.replace(`- ${this.findCount(currentName)}`, `- ${epNumber}`);
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
      { name: 'test1', url: '1111' },
      { name: 'test2', url: '2222' },
      { name: 'test3', url: '3333' },
    ];

    for (let i = 0; i < paths.length; i++) {
      const { name, url } = paths[i];
      if (i <= 1) {
        this.testAddTorrent(url, resolve(process.env.BASE_FOLDER, name), name);
      } else {
        console.log('Queued', name);
        this.queuedTorrents.push({ path: resolve(process.env.BASE_FOLDER, name), fileName: name, url });
        this.socketService.nyaaSocket.emit('torrent-queued', { url, fileName: name });
      }
    }
  }

  public async downloadShow(
    torrentName: string = 'https://nyaa.si/download/1284378.torrent',
    downloadPath: string,
    fileName: string,
  ): Promise<{ error?: string; name: string; files: WebTorrent.TorrentFile[] }> {
    try {
      console.log('Getting', torrentName, downloadPath);

      if (this.activeTorrents.some((torrent) => torrent === torrentName)) {
        console.log('Can not add dups');
        return;
      }

      console.log('Torrents downloading', this.downloadingTorrents.length);
      if (this.downloadingTorrents.length >= 4) {
        console.log('Queued', fileName);
        this.queuedTorrents.push({ fileName, path: downloadPath, url: torrentName });

        this.socketService.nyaaSocket.emit('torrent-queued', { fileName, url: torrentName });
        return;
      }

      this.addTorrent(torrentName, downloadPath);
    } catch (ex) {
      console.error(ex);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  public async syncShows(season?: string, year?: string) {
    const defaultSeason = season || (await this.settingsService.findByKey('currentSeason')).value;
    const defaultYear = year || (await this.settingsService.findByKey('currentYear')).value;

    const series = await this.seriesService.findBySeason(defaultSeason as SeasonName, Number(defaultYear));
    for await (const show of series) {
      await this.syncShow(show);
    }
  }

  public async syncById(id: number) {
    await this.syncShow(await this.seriesService.findById(id));
  }

  public async suggestSubgroups(name: string, altNames: string[]) {
    await this.waitFor(400);
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

  private async syncShow(series: Series) {
    this.socketService.nyaaSocket.emit('series-syncing', { id: series.id, type: 'STARTING' });
    await this.folderService.ensureShowFolder(series.folderPath);
    const downloadedEps = series.folderPath ? await this.findDownloadedEps(series.folderPath) : [];
    const currentCount = series.folderPath ? await this.findHighestCount(series.folderPath) : series.downloaded;
    const existingQueue = clone(series.showQueue);

    const items = await this.searchItems(NyaaFeed.ANIME, series.name, false);
    const altItems = await Promise.all(series.otherNames.map((alt) => this.searchItems(NyaaFeed.ANIME, alt, false)));

    const uniqItems = this.uniqNyaaItems(items.concat(...altItems));

    const validItems = this.findValidItems(
      (uniqItems || []).filter((item) => !downloadedEps.includes(item.episodeName)),
      series.subgroups,
    );

    series.showQueue = validItems;
    series.downloaded = series.downloaded > currentCount ? series.downloaded : currentCount;

    await this.seriesService.update({ id: series.id, downloaded: series.downloaded, showQueue: series.showQueue});

    const queueUpdated = existingQueue.every((item) => validItems.includes(item));
    const didUpdateOccur = !queueUpdated || existingQueue.length !== validItems.length;

    this.socketService.nyaaSocket.emit('series-syncing', {
      id: series.id,
      type: didUpdateOccur ? 'UPDATE_FOUND' : 'NO_UPDATE',
      queue: validItems,
    });

    await this.waitFor(1000);
  }

  private addTorrent(url: string, downloadPath: string, queued: boolean = false) {
    this.activeTorrents.push(url);
    this.downloadingTorrents.push({ path: downloadPath, url, hash: '', name: downloadPath });
    this.client.add(url, { path: downloadPath, maxWebConns: 100 }, (torrent) => {
      console.log('Client is downloading:', torrent.infoHash, torrent.name);
      this.downloadingTorrents.forEach((tor) => (tor.url === url ? { ...tor, name: torrent.name, hash: torrent.infoHash } : tor));

      this.socketService?.nyaaSocket?.emit('start-downloading', { hash: torrent.infoHash, value: { name: torrent.name, url, queued } });
      this.socketService?.nyaaSocket?.emit('metadata', { hash: torrent.infoHash, value: { name: torrent.name } });

      torrent.on('done', () => {
        console.log('torrent finished downloading');
        this.socketService?.nyaaSocket?.emit('downloaded', { hash: torrent.infoHash, value: true });
        setTimeout(() => torrent.destroy(), 100);
        this.downloadingTorrents.pop();

        const next = this.queuedTorrents.shift();

        if (next) {
          console.log('Adding new torrent', next.path);
          this.addTorrent(next.url, next.path, true);
        }

        clearInterval(interval);
      });

      torrent.on('ready', function () {
        console.log('torrent metadata', torrent.name);
        this.socketService?.nyaaSocket?.emit('metadata', { hash: torrent.infoHash, value: { name: torrent.name } });
      });

      const interval = setInterval(() => {
        this.socketService?.nyaaSocket?.emit('downloading', {
          hash: torrent.infoHash,
          value: {
            name: torrent.name,
            justDownloaded: 100,
            totalDownloaded: torrent.downloaded,
            speed: torrent.downloadSpeed,
            progress: torrent.progress,
            timeLeft: this.millisecondsToTime(torrent.timeRemaining),
            ratio: torrent.ratio,
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

  private testAddTorrent(url: string, downloadPath: string, torrentName: string, queued: boolean = false) {
    const randomNumer = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    const hash = uuidv4();

    this.activeTorrents.push(url);
    this.downloadingTorrents.push({ path: downloadPath, url, hash, name: torrentName });

    console.log('Client is downloading:', hash, torrentName);

    this.socketService?.nyaaSocket?.emit('start-downloading', { hash, value: { name: torrentName, url, queued } });
    this.socketService?.nyaaSocket?.emit('metadata', { hash, value: { name: torrentName } });

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
        this.socketService?.nyaaSocket?.emit('downloaded', { hash, name: torrentName, value: true });
        console.log('Done Downloaded', hash);

        this.downloadingTorrents.pop();

        const next = this.queuedTorrents.shift();

        if (next) {
          console.log('Adding new torrent', next.path);
          this.testAddTorrent(next.url, next.path, next.fileName, true);
        }
      }
    }, 1000);
  }

  private async findHighestCount(folderName) {
    const files = readdirSync(join(await this.folderService.getCurrentFolder(), folderName), { withFileTypes: true }).filter((item) => item.isFile());

    return files.reduce((acc, file) => {
      const epNumber = this.findCount(file.name);

      return acc < epNumber ? epNumber : acc;
    }, 0);
  }

  private async findDownloadedEps(folderName) {
    const files = readdirSync(join(await this.folderService.getCurrentFolder(), folderName), { withFileTypes: true }).filter((item) => item.isFile());

    return files.map((file) => this.findCount(file.name));
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
