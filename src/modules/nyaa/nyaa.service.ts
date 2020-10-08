import { Injectable } from '@nestjs/common';
import * as Parser from 'rss-parser';
import * as WebTorrent from 'webtorrent';
import { SubGroup } from '../sub-group/models';
import { SubGroupService } from '../sub-group';
import { NyaaRSSItem } from './models/nyaaRSSItem';
import { NyaaItem } from './models/nyaaItem';
import { SocketService } from '../socket/socket.service';

@Injectable()
export class NyaaService {
  private parser: Parser = new Parser();
  private client: WebTorrent.Instance;

  constructor(private readonly subgroupService: SubGroupService, private readonly socketService: SocketService) {
    this.client = new WebTorrent();
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
          subGroupName: item.title.match(/<b>(.*?)<\/b>/g)?.[0] ?? '',
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

  private findResolution(title: string) {
    if (title.includes('720') || title.includes('720p')) {
      return '720';
    }

    if (title.includes('1080') || title.includes('720p')) {
      return '1080';
    }

    if (title.includes('480') || title.includes('480')) {
      return '480';
    }

    return 'ANY';
  }
}

export enum NyaaFeed {
  ANIME = 'https://nyaa.si/?page=rss&c=1_2',
  BOOKS = 'https://nyaa.si/?page=rss&c=3_1',
  MUSIC = 'https://nyaa.si/?page=rss&c=2_2&f=0',
}
