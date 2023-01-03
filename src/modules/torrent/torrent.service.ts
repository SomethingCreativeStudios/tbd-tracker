import { Injectable, Logger } from '@nestjs/common';
import WebTorrent from 'webtorrent';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

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
} from './models/torrent.model';
import { rename } from 'fs-extra';
import { join } from 'path';

@Injectable()
export class TorrentService {
  private logger: Logger = new Logger('Torrent Service');
  private client: WebTorrent.Instance;

  private downloading: TorrentDownloadingModel[] = [];
  private queued: TorrentQueuedModel[] = [];

  constructor(private readonly socketService: SocketService) {
    this.client = new WebTorrent();

    this.client.on('error', (err) => {
      console.error(err);

      this.client = new WebTorrent();
    });
  }

  public onConnect(socket: Socket) {
    this.downloading.forEach((torrent) => {
      socket.emit(DownloadingEvents.INIT_DOWNLOAD, { hash: torrent.hash, value: { name: torrent.name, url: torrent.url, id: torrent.id, queued: false } });
    });

    this.queued.forEach((torrent) => {
      socket.emit(DownloadingEvents.QUEUED, { url: torrent.path, fileName: torrent.fileName });
    });
  }

  public async testDownload() {
    const progres = [0, 0, 0];

    const testTorrents = [
      { name: 'Test Name 1', id: '222222', hash: uuidv4() },
      { name: 'Test Name 2', id: '333333', hash: uuidv4() },
      { name: 'Test Name 3', id: '444444', hash: uuidv4() },
    ];

    testTorrents.forEach((torrent) => {
      this.emitInitDownloading({ hash: torrent.hash, value: { name: torrent.name, id: torrent.id, url: 'test', queued: false } });
    });

    this.waitFor(1000);

    while (!progres.every((prog) => prog >= 100)) {
      await this.waitFor(300);
      const index = this.random(0, 3);
      progres[index] += this.random(1, 100 - progres[index]);

      this.emitDownloading({
        hash: testTorrents[index].hash,
        value: {
          name: testTorrents[index].name,
          justDownloaded: 100,
          totalDownloaded: progres[index],
          speed: 300,
          progress: progres[index],
          timeLeft: this.millisecondsToTime(2000),
          ratio: '2',
          id: testTorrents[index].id,
        },
      });

      if (progres[index] >= 100) {
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

    this.logger.log(`Downloading ${realName} to ${downloadPath}`);

    if (this.downloading.length > 5) {
      this.logger.log(`Queued ${realName}`);
      this.queued.push({ fileName: realName, path: downloadPath, url: torrentName, id });

      this.emitQueued({ fileName: realName, url: torrentName });
      return;
    }

    this.startDownload(fileName, downloadPath, torrentName, id, events);
  }

  private startDownload(fileName: string, downloadPath: string, url: string, id: string, events: TorrentEvents) {
    this.downloading.push({ name: fileName, hash: '', path: downloadPath, intervalId: null, id, url, fileName });

    this.client.add(url, { path: downloadPath, maxWebConns: 100 }, (torrent) => {
      const realName = fileName || torrent.name;
      this.logger.log(`Client is downloading ${realName}`);

      this.emitInitDownloading({ hash: torrent.infoHash, value: { name: realName, id, url, queued: false } });
      this.emitMetadata({ hash: torrent.infoHash, value: { name: realName, id } });

      this.torrentDone(torrent, realName, id, url, downloadPath, !!fileName, events);
      this.torrentError(torrent);
      this.torrentReady(torrent, realName, id);

      this.downloading = this.downloading.map((tor) => {
        if (tor.url !== url) return tor;
        const interval = setInterval(
          () =>
            this.emitDownloading({
              hash: torrent.infoHash,
              value: {
                name: realName,
                justDownloaded: 100,
                totalDownloaded: torrent.downloaded,
                speed: torrent.downloadSpeed,
                progress: torrent.progress,
                timeLeft: this.millisecondsToTime(torrent.timeRemaining),
                ratio: torrent.ratio,
                id,
              },
            }),
          1000,
        );

        return { ...tor, intervalId: interval };
      });
    });
  }

  private torrentDone(torrent: any, name: string, id: string, url: string, downloadPath: string, isOverrideName: boolean, events: TorrentEvents) {
    torrent.on('done', async () => {
      this.emitDownloaded({ hash: torrent.infoHash, id, name });

      if (isOverrideName) {
        rename(join(downloadPath, torrent.name), join(downloadPath, name));
      }

      const found = this.downloading.find((tor) => tor.url === url);
      this.downloading = this.downloading.filter((tor) => tor.url === url);
      setTimeout(() => torrent.destroy(), 100);

      events?.onDone ? events.onDone(id) : null;

      const next = this.queued.shift();

      if (next) {
        this.startDownload(next.fileName, next.fileName, next.url, next.id, events);
      }

      clearInterval(found.intervalId);
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
