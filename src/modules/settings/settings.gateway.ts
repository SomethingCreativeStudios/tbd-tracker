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
import { SettingsService } from './settings.service';
import { SocketService } from '../socket/socket.service';
import { Settings } from './models';

@WebSocketGateway(8180, { namespace: 'settings' })
export class SettingsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private settingService: SettingsService, private socketService: SocketService) {}
  afterInit(server: Server) {
    this.socketService.settingsSocket = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('SettingsGateway');

  @SubscribeMessage('create')
  async createSettings(@MessageBody() settings: Settings) {
    return this.settingService.create(settings);
  }

  @SubscribeMessage('fetch')
  async findAll() {
    return this.settingService.findAll();
  }

  @SubscribeMessage('key')
  async findByKey(@MessageBody() key: string) {
    return this.settingService.findByKey(key);
  }

  @SubscribeMessage('update')
  async updateSettings(@MessageBody() { key, value }: { key: string; value: string }) {
    const foundKey = (await this.settingService.findByKey(key)) || (await this.settingService.createKey(key));
    return this.settingService.update({ ...foundKey, value });
  }

  @SubscribeMessage('delete')
  async removeSettings(@MessageBody() id: number) {
    return this.settingService.remove(id);
  }
}
