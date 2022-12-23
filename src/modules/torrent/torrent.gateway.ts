import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { SocketService } from '../socket/socket.service';
import { TorrentService } from './torrent.service';

@WebSocketGateway(8180, { namespace: 'torrent', transports: ['websocket'] })
export class TorrentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private torrentService: TorrentService, private socketService: SocketService) {}
  afterInit(server: any) {
    this.socketService.torrentSocket = server;
  }

  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;
}
