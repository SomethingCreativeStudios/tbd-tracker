import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MALClient } from '@chez14/mal-api-lite'
import pkceChallenge from 'pkce-challenge'
import { SeriesService } from './series.service';
import { SocketService } from '../socket/socket.service';
import { AnimeFolderService } from '../anime-folder/anime-folder.service';
import { SearchBySeasonDTO } from './dtos/SearchBySeasonDTO';
import { CreateBySeasonDTO } from './dtos/CreateBySeasonDTO';
import { CreateFromMalDTO } from './dtos/CreateFromMalDTO';
import { UpdateSeriesDTO } from './dtos/UpdateSeriesDTO';
import { MalSearchDTO } from './dtos/MalSearchDTO';
import { MigrateSeriesDTO } from './dtos/MigrateSeriesDTO';
import { AuthService } from '../auth';
import { SocketGuard } from '~/guards/SocketGuard';

@WebSocketGateway(8180, { namespace: 'series', transports: ['websocket'] })
export class SeriesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {


  constructor(private seriesService: SeriesService, private folderService: AnimeFolderService, private socketService: SocketService) { }
  afterInit(server: Server) {
    this.socketService.seriesSocket = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    if (!client.handshake.auth?.token) {
      client.disconnect();
    }
  }
  handleDisconnect(client: any) { }

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SeriesGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('create-mal')
  async createMal(@MessageBody() createModel: CreateFromMalDTO) {
    return this.seriesService.createFromMALId(createModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('update')
  async updateSeries(@MessageBody() updateModel: UpdateSeriesDTO) {
    return this.seriesService.update(updateModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('get-by-it')
  async fetchById(@MessageBody() id: number) {
    return this.seriesService.findById(id);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('remove')
  async removeSeries(@MessageBody() id: number) {
    return this.seriesService.deleteById(id);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('find-by-season')
  async getAllSeries(@MessageBody() { season, year, sortBy }: SearchBySeasonDTO) {
    if (!season && !year) {
      return this.seriesService.findAll();
    }

    return this.seriesService.findBySeason(season, +year, sortBy as any);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('create-season')
  async createSeason(@MessageBody() createModel: CreateBySeasonDTO) {
    const test = await this.seriesService.createFromSeason(createModel);
    console.log('test');
    return test;
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('migrate-series')
  async migrateSeries(@MessageBody() migrateModel: MigrateSeriesDTO) {
    return this.seriesService.migrateSeries(migrateModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('mal/search-name')
  async searchMAL(@MessageBody() name: string) {
    return this.seriesService.findFromMAL(name);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('mal/search-season')
  async findAllBySeason(@MessageBody() searchModel: MalSearchDTO) {
    return this.seriesService.searchByMALSeason(searchModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('toggle-watch-status')
  async updateWatchCount(@MessageBody() id: number) {
    return this.seriesService.toggleWatchStatus(id);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('folder-names')
  async fetchFolderNames() {
    const folders = await this.folderService.getFolders();
    console.log(folders);
    return folders;
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('sync-mal')
  async syncWithMal(@MessageBody() id: number) {
    return this.seriesService.syncWithMal(id);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('sync-mal-image')
  async syncImageWithMal(@MessageBody() id: number) {
    return this.seriesService.syncImage(id);
  }
}
