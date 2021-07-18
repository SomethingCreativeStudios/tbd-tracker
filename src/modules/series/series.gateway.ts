import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SeriesService } from './series.service';
import { SeasonName } from '../season/models';
import { DeepPartial } from 'typeorm';
import { Series } from './models';
import { mergeDeepRight } from 'ramda';
import { SocketService } from '../socket/socket.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { SearchBySeasonDTO } from './dtos/SearchBySeasonDTO';
import { CreateBySeasonDTO } from './dtos/CreateBySeasonDTO';
import { CreateFromMalDTO } from './dtos/CreateFromMalDTO';
import { UpdateSeriesDTO } from './dtos/UpdateSeriesDTO';
import { MalSearchDTO } from './dtos/MalSearchDTO';

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

  @SubscribeMessage('create-mal')
  async createMal(@MessageBody() createModel: CreateFromMalDTO) {
    return this.seriesService.createFromMALId(createModel);
  }

  @SubscribeMessage('update')
  async updateSeries(@MessageBody() updateModel: UpdateSeriesDTO) {
    return this.seriesService.update(updateModel);
  }

  @SubscribeMessage('remove')
  async removeSeries(@MessageBody() id: number) {
    return this.seriesService.deleteById(id);
  }

  @SubscribeMessage('find-by-season')
  async getAllSeries(@MessageBody() { season, year, sortBy }: SearchBySeasonDTO) {
    if (!season && !year) {
      return this.seriesService.findAll();
    }

    return this.seriesService.findBySeason(season, +year, sortBy as any);
  }

  @SubscribeMessage('create-season')
  async createSeason(@MessageBody() createModel: CreateBySeasonDTO) {
    return this.seriesService.createFromSeason(createModel);
  }

  @SubscribeMessage('mal/search-name')
  async searchMAL(@MessageBody() name: string) {
    return this.seriesService.findFromMAL(name);
  }

  @SubscribeMessage('mal/search-season')
  async findAllBySeason(@MessageBody() searchModel: MalSearchDTO) {
    return this.seriesService.searchByMALSeason(searchModel);
  }

  @SubscribeMessage('toggle-watch-status')
  async updateWatchCount(@MessageBody() id: number) {
    return this.seriesService.toggleWatchStatus(id);
  }

  @SubscribeMessage('folder-names')
  async fetchFolderNames() {
    return this.folderService.getFolders();
  }
}
