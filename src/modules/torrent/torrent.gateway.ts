import { UseGuards } from '@nestjs/common';
import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SocketGuard } from '~/guards/SocketGuard';

import { SocketService } from '../socket/socket.service';
import { DirectDownloadMessage } from './models/torrent.model';
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

  @UseGuards(SocketGuard)
  @SubscribeMessage('test-download')
  async testDownload() {
    this.torrentService.testDownload();
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('direct-download')
  async directDownload(@MessageBody() { fileName, path, url }: DirectDownloadMessage) {
    this.torrentService.download(url, path, fileName, null);
  }
}
