import { Logger, UseGuards } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'typeorm';
import { SocketGuard } from '~/guards/SocketGuard';
import { SocketService } from '../socket/socket.service';
import { LibraryType } from './models/plex.model';
import { PlexService } from './plex.service';

@WebSocketGateway(8180, { namespace: 'plex', transports: ['websocket'] })
export class PlexGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private plexService: PlexService, private socketService: SocketService) {}
  afterInit(server: any) {
    this.socketService.plexSocket = server;
  }

  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('PlexGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('sync')
  async syncSeries(@MessageBody() type: LibraryType) {
    this.logger.log(`Syncing ${type}`);
    this.plexService.refresh(type);
  }
}
