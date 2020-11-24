import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdirSync } from 'fs-extra';
import { clone } from 'ramda';

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

  constructor(
    private readonly subgroupService: SubGroupService,
    private readonly configService: ConfigService,
    private readonly seriesService: SeriesService,
    private readonly socketService: SocketService,
    private readonly settingsService: SettingsService,
  ) {
    this.client = new WebTorrent();
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

  public async downloadShow(
    torrentName: string = 'https://nyaa.si/download/1284378.torrent',
    downloadPath: string,
  ): Promise<{ error?: string; name: string; files: WebTorrent.TorrentFile[] }> {
    return new Promise(resolve => {
      try {
        this.client.add(torrentName, { path: downloadPath, maxWebConns: 100 }, torrent => {
          console.log('Client is downloading:', torrent.infoHash);
          this.socketService?.socket?.emit('start-downloading', { hash: torrent.infoHash, value: true });

          torrent.on('done', () => {
            console.log('torrent finished downloading');
            this.socketService?.socket?.emit('downloaded', { hash: torrent.infoHash, value: true });
            setTimeout(() => torrent.destroy(), 100);
            resolve({ name: torrent.name, files: torrent.files });
          });

          torrent.on('metadata', function() {
            console.log('torrent metadata', torrent.name);
            this.socketService?.socket?.emit('metadata', { hash: torrent.infoHash, value: { name: torrent.name } });
          });

          torrent.on('download', function(bytes) {
            if ((torrent.progress * 100) % 25 === 0) {
              console.log(torrent.progress * 100);
              this.socketService?.socket?.emit('downloading-quarter', { progress: torrent.progress * 100 });
            }

            this.socketService?.socket?.emit('downloading', {
              hash: torrent.infoHash,
              value: {
                justDownloaded: bytes,
                totalDownloaded: torrent.downloaded,
                speed: torrent.downloadSpeed,
                progress: torrent.progress,
              },
            });
          });

          torrent.on('error', message => {
            console.log('torrent error', message.toString());
            this.socketService?.socket?.emit('error', { hash: torrent.infoHash, value: message });
            resolve({ error: message.toString(), name: torrent.name, files: [] });
          });
        });
      } catch (ex) {
        console.error(ex);
        resolve({ error: 'Error Adding', name: '', files: [] });
      }
    });
  }

  // @Cron('30 * * * *')
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
    const currentCount = series.folderPath ? this.findHighestCount(series.folderPath) : series.downloaded;
    const existingQueue = clone(series.showQueue);

    const items = await this.searchItems(NyaaFeed.ANIME, series.name, false);

    const validItems = this.findValidItems(
      (items || []).filter(item => item.episodeName > currentCount),
      series.subgroups,
    );

    series.showQueue = validItems;
    series.downloaded = currentCount;

    await this.seriesService.update(series);

    const queueUpdated = existingQueue.every(item => validItems.includes(item));

    if (!queueUpdated || existingQueue.length !== validItems.length) {
      this.socketService.socket.emit('queue-update', { show: series });
    }
    await this.waitFor(100);
  }

  private findHighestCount(folderName) {
    const files = readdirSync(`${this.configService.baseFolder}/${folderName}`, { withFileTypes: true }).filter(item => item.isFile());

    return files.reduce((acc, file) => {
      const epNumber = this.findCount(file.name);

      return acc < epNumber ? epNumber : acc;
    }, 0);
  }

  private findResolution(title: string) {
    if (title.includes('720') || title.includes('720p')) {
      return '720';
    }

    if (title.includes('1080') || title.includes('720p')) {
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
}

export enum NyaaFeed {
  ANIME = 'https://nyaa.si/?page=rss&c=1_2',
  BOOKS = 'https://nyaa.si/?page=rss&c=3_1',
  MUSIC = 'https://nyaa.si/?page=rss&c=2_2&f=0',
}
