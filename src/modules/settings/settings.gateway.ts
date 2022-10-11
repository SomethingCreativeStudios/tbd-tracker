import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SettingsService } from './settings.service';
import { SocketService } from '../socket/socket.service';
import { Settings } from './models';
import { CreateSettingDTO } from './dto/CreateSettingDTO';
import { FindSettingDTO } from './dto/FindSettingDTO';
import { UpdateSettingDTO } from './dto/UpdateSettingDTO';
import { SocketGuard } from '~/guards/SocketGuard';

@WebSocketGateway(8180, { namespace: 'settings', transports: ['websocket'] })
export class SettingsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private settingService: SettingsService, private socketService: SocketService) { }
  afterInit(server: Server) {
    this.socketService.settingsSocket = server;
  }

  async handleConnection(client: Socket, ...args: any[]) { }
  handleDisconnect(client: any) { }

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SettingsGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('create')
  async createSettings(@MessageBody() settings: CreateSettingDTO) {
    return this.settingService.create(settings);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('search')
  async find(searchModel: FindSettingDTO) {
    return this.settingService.find(searchModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('update')
  async updateSettings(@MessageBody() updateModel: UpdateSettingDTO) {
    return this.settingService.update(updateModel);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('delete')
  async removeSettings(@MessageBody() id: number) {
    return this.settingService.remove(id);
  }
}
