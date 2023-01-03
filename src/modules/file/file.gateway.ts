import { WebSocketGateway, OnGatewayInit, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { SocketService } from '../socket/socket.service';
import { SocketGuard } from '~/guards/SocketGuard';
import { FileService } from './file.service';
import { dirname } from 'path';

@WebSocketGateway(8180, { namespace: 'file', transports: ['websocket'] })
export class FileGateway implements OnGatewayInit {
  constructor(private fileService: FileService, private socketService: SocketService) {}

  afterInit(server: Server) {
    this.socketService.fileSocket = server;
  }

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('FileGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('dir-up')
  async directoryUp(@MessageBody() { path }: { path: string }) {
    return this.fileService.directoryUp(path);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('dir-go-to')
  async goTo(@MessageBody() { path }: { path: string }) {
    return this.fileService.directoryGoTo(path);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('dir-parent')
  async getParentDir(@MessageBody() { path }: { path: string }) {
    return dirname(path);
  }
}
