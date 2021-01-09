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
import { Server, Socket } from 'socket.io';
import { SeriesService } from './series.service';
import { SeasonName } from '../season/models';
import { DeepPartial } from 'typeorm';
import { Series } from './models';
import { mergeDeepRight } from 'ramda';
import { SocketService } from '../socket/socket.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';

@WebSocketGateway(8180, { namespace: 'series' })
export class SeriesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private seriesService: SeriesService, private folderService: AnimeFolderService, private socketService: SocketService) {}
  afterInit(server: Server) {
    this.socketService.seriesSocket = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    client.emit('initial', await this.seriesService.findAll());
  }
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SeriesGateway');

  @SubscribeMessage('get')
  async getAllSeries(@MessageBody() { season, year, sortBy }: { season?: string; year?: number; sortBy: '' }) {
    if (!season && !year) {
      return this.seriesService.findAll();
    }

    return this.seriesService.findBySeason(season, +year, sortBy as any);
  }

  @SubscribeMessage('create-season')
  async createSeason(@MessageBody() { seasonName, seasonYear, series }: { series: Series[]; seasonName: SeasonName; seasonYear: number }) {
    return this.seriesService.createFromSeason(series, seasonName, seasonYear);
  }

  @SubscribeMessage('create-mal')
  async createMal(@MessageBody() { seasonName, seasonYear, malId }: { malId: number; seasonName: SeasonName; seasonYear: number }) {
    console.log(seasonName, seasonYear);
    return this.seriesService.createFromMALId(malId, seasonName, seasonYear);
  }

  @SubscribeMessage('mal-search')
  async searchMAL(@MessageBody() name: string) {
    return this.seriesService.findFromMAL(name);
  }

  @SubscribeMessage('season-search')
  async findAllBySeason(@MessageBody() { season, year }: { season: SeasonName; year: number }) {
    return this.seriesService.searchByMALSeason(season, year);
  }

  @SubscribeMessage('update')
  async updateSeries(@MessageBody() series: DeepPartial<Series>) {
    const foundSeries = await this.seriesService.findById(series.id);
    return this.seriesService.update(mergeDeepRight(foundSeries, series) as Series);
  }

  @SubscribeMessage('watch-status')
  async updateWatchCount(@MessageBody() id: number) {
    return this.seriesService.updateWatchStatus(id);
  }

  @SubscribeMessage('remove')
  async removeSeries(@MessageBody() id: number) {
    return this.seriesService.deketeById(id);
  }

  @SubscribeMessage('folder-names')
  async fetchFolderNames() {
    return this.folderService.getFolders();
  }
}
