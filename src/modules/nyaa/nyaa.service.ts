import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readdirSync } from 'fs-extra';
import { clone } from 'ramda';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { resolve } from 'path';

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

@Injectable()
export class NyaaService {
  private parser: Parser = new Parser();
  private client: WebTorrent.Instance;
  private activeTorrents: string[] = [];
  private downloadingTorrents: { path: string; hash: string; name: string; url: string }[] = [];
  private queuedTorrents: { path: string; url: string; fileName: string }[] = [];

  constructor(
    private readonly subgroupService: SubGroupService,
    private readonly configService: ConfigService,
    private readonly seriesService: SeriesService,
    private readonly socketService: SocketService,
    private readonly settingsService: SettingsService,
  ) {
    this.client = new WebTorrent();
  }

  public onConnect(socket: Socket) {
    this.downloadingTorrents.forEach(torrent => {
      socket.emit('start-downloading', { hash: torrent.hash, value: { name: torrent.name, url: torrent.url, queued: false } });
    });

    this.queuedTorrents.forEach(torrent => {
      console.log('sending', torrent);
      socket.emit('torrent-queued', { url: torrent.path, fileName: torrent.fileName });
    });
  }

  public async searchItems(feed: NyaaFeed, searchTerm: string, onlyTrusted = false): Promise<NyaaItem[]> {
    try {
      const trusted = onlyTrusted ? '&f=2' : '';
      const query = `&q=${encodeURI(searchTerm)}`;

      const { items = [] } = (await this.parser.parseURL(`${feed}${trusted}${query}`)) || {};
      console.log(`${feed}${trusted}${query}`);
      return (items as NyaaRSSItem[]).map(item => {
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

  /**
   * Get all items in the specified feed
   * @param feed
   */
  public async fetchItems(feed: NyaaFeed): Promise<NyaaItem[]> {
    try {
      const { items = [] } = (await this.parser.parseURL(feed)) || {};

      return (items as NyaaRSSItem[]).map(item => {
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
    return items.filter(item => this.isValidItem(item, groups));
  }

  public isValidItem(item: NyaaItem, groups: SubGroup[]) {
    const validSubgroups = groups.filter(group => group.name.toLowerCase() === item.subGroupName.toLowerCase());

    if (validSubgroups.length === 0) {
      return false;
    }

    return validSubgroups.some(group => this.subgroupService.matchesSubgroup(item.itemName, group));
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
        this.socketService.socket.emit('torrent-queued', { url, fileName: name });
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

      if (this.activeTorrents.some(torrent => torrent === torrentName)) {
        console.log('Can not add dups');
        return;
      }

      console.log('Torrents downloading', this.downloadingTorrents.length);
      if (this.downloadingTorrents.length >= 4) {
        console.log('Queued', fileName);
        this.queuedTorrents.push({ path: downloadPath, url: torrentName, fileName });

        this.socketService.socket.emit('torrent-queued', { url: torrentName, fileName: fileName });
        return;
      }

      this.addTorrent(torrentName, downloadPath);
    } catch (ex) {
      console.error(ex);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  public async syncShows() {
    const defaultSeason = await this.settingsService.findByKey('currentSeason');
    const defaultYear = await this.settingsService.findByKey('currentYear');

    const series = await this.seriesService.findBySeason(defaultSeason.value as SeasonName, Number(defaultYear.value));
    for await (const show of series) {
      await this.syncShow(show);
    }
  }

  public async syncById(id: number) {
    await this.syncShow(await this.seriesService.findById(id));
  }

  private async syncShow(series: Series) {
    this.socketService.socket.emit('queue-syncing', { show: series });
    const downloadedEps = series.folderPath ? this.findDownloadedEps(series.folderPath) : [];
    const currentCount = series.folderPath ? this.findHighestCount(series.folderPath) : series.downloaded;
    const existingQueue = clone(series.showQueue);

    const items = await this.searchItems(NyaaFeed.ANIME, series.name, false);

    const validItems = this.findValidItems(
      (items || []).filter(item => !downloadedEps.includes(item.episodeName)),
      series.subgroups,
    );

    series.showQueue = validItems;
    series.downloaded = currentCount;

    await this.seriesService.update(series);

    const queueUpdated = existingQueue.every(item => validItems.includes(item));

    if (!queueUpdated || existingQueue.length !== validItems.length) {
      this.socketService.socket.emit('queue-update', { show: series });
    } else {
      this.socketService.socket.emit('queue-noupdate', { show: series });
    }
    await this.waitFor(100);
  }

  private addTorrent(url: string, downloadPath: string, queued: boolean = false) {
    this.activeTorrents.push(url);
    this.downloadingTorrents.push({ path: downloadPath, url, hash: '', name: downloadPath });
    this.client.add(url, { path: downloadPath, maxWebConns: 100 }, torrent => {
      console.log('Client is downloading:', torrent.infoHash, torrent.name);
      this.downloadingTorrents.map(tor => (tor.url === url ? { ...tor, name: torrent.name, hash: torrent.infoHash } : tor));

      this.socketService?.socket?.emit('start-downloading', { hash: torrent.infoHash, value: { name: torrent.name, url, queued } });
      this.socketService?.socket?.emit('metadata', { hash: torrent.infoHash, value: { name: torrent.name } });

      torrent.on('done', () => {
        console.log('torrent finished downloading');
        this.socketService?.socket?.emit('downloaded', { hash: torrent.infoHash, value: true });
        setTimeout(() => torrent.destroy(), 100);
        this.downloadingTorrents.pop();

        const next = this.queuedTorrents.shift();

        if (next) {
          console.log('Adding new torrent', next.path);
          this.addTorrent(next.url, next.path, true);
        }

        clearInterval(interval);
      });

      torrent.on('ready', function() {
        console.log('torrent metadata', torrent.name);
        this.socketService?.socket?.emit('metadata', { hash: torrent.infoHash, value: { name: torrent.name } });
      });

      const interval = setInterval(() => {
        this.socketService?.socket?.emit('downloading', {
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

      torrent.on('error', message => {
        console.log('torrent error', message.toString());
        this.socketService?.socket?.emit('error', { hash: torrent.infoHash, value: message });
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

    this.socketService?.socket?.emit('start-downloading', { hash, value: { name: torrentName, url, queued } });
    this.socketService?.socket?.emit('metadata', { hash, value: { name: torrentName } });

    let totalDownloaded = 0;

    const timeout = setInterval(() => {
      const justDownloaded = randomNumer(10, 22);
      totalDownloaded += justDownloaded;

      this.socketService?.socket?.emit('downloading', {
        hash,
        value: {
          name: torrentName,
          justDownloaded: justDownloaded,
          totalDownloaded: totalDownloaded,
          speed: 1000,
          progress: totalDownloaded / 100,
        },
      });

      if (totalDownloaded >= 100) {
        clearInterval(timeout);
        this.socketService?.socket?.emit('downloaded', { hash, name: torrentName, value: true });
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

  private findHighestCount(folderName) {
    const files = readdirSync(`${this.configService.baseFolder}/${folderName}`, { withFileTypes: true }).filter(item => item.isFile());

    return files.reduce((acc, file) => {
      const epNumber = this.findCount(file.name);

      return acc < epNumber ? epNumber : acc;
    }, 0);
  }

  private findDownloadedEps(folderName) {
    const files = readdirSync(`${this.configService.baseFolder}/${folderName}`, { withFileTypes: true }).filter(item => item.isFile());

    return files.map(file => this.findCount(file.name));
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
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  private millisecondsToTime(milli) {
    var milliseconds = milli % 1000;
    var seconds = Math.floor((milli / 1000) % 60) ? Math.floor((milli / 1000) % 60) + ' seconds' : '';
    var minutes = Math.floor((milli / (60 * 1000)) % 60) ? Math.floor((milli / (60 * 1000)) % 60) + ' minutes ' : '';

    return minutes + seconds;
  }
}

export enum NyaaFeed {
  ANIME = 'https://nyaa.si/?page=rss&c=1_2',
  BOOKS = 'https://nyaa.si/?page=rss&c=3_1',
  MUSIC = 'https://nyaa.si/?page=rss&c=2_2&f=0',
}
