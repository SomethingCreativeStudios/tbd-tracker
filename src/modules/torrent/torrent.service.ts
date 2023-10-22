import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import WebTorrent from 'webtorrent';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Cache } from 'cache-manager';
import { throttle } from 'throttle-debounce';

import { SocketService } from '../socket/socket.service';
import {
  TorrentDownloadingModel,
  TorrentQueuedModel,
  DownloadingEvent,
  DownloadingEvents,
  QueuedEvent,
  InitDownloadingEVent,
  MetadataEvent,
  FinishedEvent,
  TorrentEvents,
  MediaType,
} from './models/torrent.model';
import { rename } from 'fs-extra';
import { join } from 'path';
import { LibraryType, PlexService } from '../plex';

@Injectable()
export class TorrentService {
  private logger: Logger = new Logger('Torrent Service');
  private client: WebTorrent.Instance;

  private downloading: TorrentDownloadingModel[] = [];
  private queued: TorrentQueuedModel[] = [];

  constructor(
    private readonly socketService: SocketService,
    private readonly plexService: PlexService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {
    this.client = new WebTorrent();

    this.client.on('error', (err) => {
      console.error(err);

      this.client = new WebTorrent();
    });
  }

  public async resumeStuff() {
    const downloadItems = (await this.cacheManager.get<TorrentDownloadingModel[]>('download:items')) || [];

    const queuedItems = (await this.cacheManager.get<TorrentQueuedModel[]>('queued:items')) || [];

    [...downloadItems, ...queuedItems].forEach((item) => {
      this.download(item.url, item.path, item.fileName, null, {
        onDone: () => {
          this.plexService.refresh(LibraryType.MOVIE);
          this.plexService.refresh(LibraryType.TV_SHOW);
        },
      });
    });
  }

  public async onConnect(socket: Socket) {
    this.downloading.forEach((torrent) => {
      socket.emit(DownloadingEvents.INIT_DOWNLOAD, { hash: torrent.hash, value: { name: torrent.name, url: torrent.url, id: torrent.id, queued: false } });
    });

    this.queued.forEach((torrent) => {
      socket.emit(DownloadingEvents.QUEUED, { url: torrent.path, fileName: torrent.fileName });
    });
  }

  public async testDownload() {
    const progress = [0, 0, 0];

    const testTorrents = [
      { name: 'Test Name 1', id: '222222', hash: uuidv4() },
      { name: 'Test Name 2', id: '333333', hash: uuidv4() },
      { name: 'Test Name 3', id: '444444', hash: uuidv4() },
    ];

    testTorrents.forEach((torrent) => {
      this.emitInitDownloading({ hash: torrent.hash, value: { name: torrent.name, id: torrent.id, url: 'test', queued: false } });
    });

    this.waitFor(1000);

    while (!progress.every((prog) => prog >= 100)) {
      await this.waitFor(300);
      const index = this.random(0, 3);
      progress[index] += this.random(1, 100 - progress[index]);

      this.emitDownloading({
        hash: testTorrents[index].hash,
        value: {
          name: testTorrents[index].name,
          justDownloaded: 100,
          totalDownloaded: progress[index],
          speed: 300,
          progress: progress[index],
          timeLeft: this.millisecondsToTime(2000),
          ratio: '2',
          id: testTorrents[index].id,
        },
      });

      if (progress[index] >= 100) {
        this.emitDownloaded({ hash: testTorrents[index].hash, id: testTorrents[index].id, name: testTorrents[index].name });
      }
    }
  }

  public async download(torrentName: string, downloadPath: string, fileName: string, queuedName: string, events: TorrentEvents = null, id: string = uuidv4()) {
    this.logger.log(`Adding ${torrentName}`);
    const realName = fileName || queuedName;

    if (this.downloading.some((torrent) => torrent.fileName === torrentName)) {
      this.logger.warn('Cannot add dups');
      return;
    }

    if (this.downloading.length > 8) {
      this.logger.log(`Queued ${realName}`);
      this.queued.push({ fileName: realName, path: downloadPath, url: torrentName, id });

      this.cacheManager.set('queued:items', this.queued, { ttl: 0 });

      this.emitQueued({ fileName: realName, url: torrentName });
      return;
    }

    this.startDownload(fileName, downloadPath, torrentName, id, events);
  }

  private startDownload(fileName: string, downloadPath: string, url: string, id: string, events: TorrentEvents) {
    this.downloading.push({ name: fileName, hash: '', path: downloadPath, intervalId: null, id, url, fileName });

    this.cacheManager.set('download:items', this.downloading, { ttl: 0 });

    this.client.add(url, { path: downloadPath, maxWebConns: 200 }, (torrent) => {
      const realName = fileName || torrent.name;
      this.logger.log(`Client is downloading ${realName}`);

      this.emitInitDownloading({ hash: torrent.infoHash, value: { name: realName, id, url, queued: false } });
      this.emitMetadata({ hash: torrent.infoHash, value: { name: realName, id } });

      this.torrentDone(torrent, realName, id, url, downloadPath, !!fileName, events);
      this.torrentError(torrent);
      this.torrentDownload(torrent, realName, id);
      this.torrentReady(torrent, realName, id);
    });
  }

  private torrentDownload(torrent: any, name: string, id: string) {
    const debounceThing = throttle(1000, () => {
      if (torrent.progress === 1) {
        return;
      }

      this.emitDownloading({
        hash: torrent.infoHash,
        value: {
          name,
          id,
          justDownloaded: 100,
          totalDownloaded: torrent.downloaded,
          speed: torrent.downloadSpeed,
          progress: torrent.progress,
          timeLeft: this.millisecondsToTime(torrent.timeRemaining),
          ratio: torrent.ratio,
        },
      });
    });

    torrent.on('download', debounceThing);
  }

  private torrentDone(torrent: any, name: string, id: string, url: string, downloadPath: string, isOverrideName: boolean, events: TorrentEvents) {
    torrent.on('done', async () => {
      this.emitDownloaded({ hash: torrent.infoHash, id, name });

      if (isOverrideName) {
        rename(join(downloadPath, torrent.name), join(downloadPath, name));
      }

      this.downloading = this.downloading.filter((tor) => tor.url !== url);
      this.cacheManager.set('download:items', this.downloading, { ttl: 0 });

      setTimeout(() => torrent.destroy(), 100);

      events?.onDone ? events.onDone(id) : null;

      const next = this.queued.shift();

      this.cacheManager.set('queued:items', this.queued, { ttl: 0 });

      if (next) {
        this.startDownload(next.fileName, next.path, next.url, next.id, events);
      }
    });
  }

  private torrentReady(torrent: any, name: string, id: string) {
    torrent.on('ready', () => {
      this.emitMetadata({ hash: torrent.infoHash, value: { name, id } });
    });
  }

  private torrentError(torrent: any) {
    torrent.on('error', (message) => {
      this.socketService.torrentSocket.emit('error', { hash: torrent.infoHash, value: message });
      this.downloading.pop();
    });
  }

  private emitInitDownloading(payload: InitDownloadingEVent) {
    this.socketService.torrentSocket.emit(DownloadingEvents.INIT_DOWNLOAD, payload);
  }

  private emitDownloading(payload: DownloadingEvent) {
    this.socketService.torrentSocket.emit(DownloadingEvents.DOWNLOADING, payload);
  }

  private emitQueued(payload: QueuedEvent) {
    this.socketService.torrentSocket.emit(DownloadingEvents.QUEUED, payload);
  }

  private emitDownloaded(payload: FinishedEvent) {
    this.socketService.torrentSocket.emit(DownloadingEvents.FINISHED, payload);
  }

  private emitMetadata(payload: MetadataEvent) {
    this.socketService.torrentSocket.emit(DownloadingEvents.METADATA, payload);
  }

  private millisecondsToTime(milli) {
    var seconds = Math.floor((milli / 1000) % 60) ? Math.floor((milli / 1000) % 60) + ' seconds' : '';
    var minutes = Math.floor((milli / (60 * 1000)) % 60) ? Math.floor((milli / (60 * 1000)) % 60) + ' minutes ' : '';

    return minutes + seconds;
  }

  private async waitFor(time: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(() => {});
      }, time);
    });
  }

  private random(min: number, max: number) {
    return Math.round(Math.random() * max) + min;
  }
}
