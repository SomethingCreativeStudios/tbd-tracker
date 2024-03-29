import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { NyaaService, NyaaFeed } from './nyaa.service';
import { resolve } from 'path';
import { SeriesService } from '../series/series.service';
import { SocketService } from '../socket/socket.service';
import { SyncDTO } from './dto/SyncDTO';
import { SuggestSubgroupDTO } from './dto/SuggestSubgroupDTO';
import { DownloadDTO } from './dto/DownloadDTO';
import { SearchNyaaDTO } from './dto/SearchNyaaDTO';
import { SocketGuard } from '~/guards/SocketGuard';

@WebSocketGateway(8180, { namespace: 'nyaa', transports: ['websocket'] })
export class NyaaGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private nyaaService: NyaaService, private socketService: SocketService, private seriesService: SeriesService) {}
  afterInit(server: any) {
    this.socketService.nyaaSocket = server;
  }

  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('NyaaGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('sync')
  async syncSeries(@MessageBody() { id, season, year }: SyncDTO) {
    id ? this.nyaaService.syncById(id) : this.nyaaService.syncShowsCron();
    return true;
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('suggest-subgroups')
  async suggestShow(@MessageBody() { altNames, showName }: SuggestSubgroupDTO) {
    return this.nyaaService.suggestSubgroups(showName, altNames);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('download')
  async downloadShow(@MessageBody() { seriesId, url, name }: DownloadDTO) {
    const series = await this.seriesService.findById(seriesId);

    const overrideName = this.nyaaService.findOverrideName(series.showName, series.offset, name);
    const downloadName = overrideName === name ? '' : overrideName;

    await this.nyaaService.downloadShow(url, resolve(process.env.BASE_FOLDER, String(series.season.year), series.season.name, series.folderPath), downloadName, series.id, name);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('test-download')
  async testDownload() {
    this.nyaaService.testDownload();
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('fetch')
  async fetchQueue(@MessageBody() { search, feed, trusted = false }: SearchNyaaDTO) {
    return this.nyaaService.searchItems(feed, search, trusted);
  }
}
