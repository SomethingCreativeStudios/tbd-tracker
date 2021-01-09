import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { NyaaService, NyaaFeed } from './nyaa.service';
import { resolve } from 'path';
import { SeriesService } from '../series/series.service';
import { SocketService } from '../socket/socket.service';

@WebSocketGateway(8180, { namespace: 'nyaa' })
export class NyaaGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private nyaaService: NyaaService, private socketService: SocketService, private seriesService: SeriesService) {}
  afterInit(server: any) {
    this.socketService.nyaaSocket = server;
  }

  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('NyaaGateway');

  @SubscribeMessage('sync')
  async syncSeries(@MessageBody() { id, season, year }: { id?: number; season: string; year: string }) {
    id ? this.nyaaService.syncById(id) : this.nyaaService.syncShows(season, year);
    return true;
  }

  @SubscribeMessage('download')
  async downloadShow(@MessageBody() { seriesId, url, name }: { url: string; seriesId: number; name: string }) {
    const series = await this.seriesService.findById(seriesId);

    await this.nyaaService.downloadShow(
      url,
      resolve(process.env.BASE_FOLDER, String(series.season.year), series.season.name, series.folderPath),
      name,
    );
  }

  @SubscribeMessage('test-download')
  async testDownload() {
    this.nyaaService.testDownload();
  }

  @SubscribeMessage('fetch')
  async fetchQueue(@MessageBody() { search, feed, trusted = false }: { search: string; feed: NyaaFeed; trusted: boolean }) {
    return this.nyaaService.searchItems(feed, search, trusted);
  }
}
