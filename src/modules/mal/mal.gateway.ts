import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { CACHE_MANAGER, Inject, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Cache } from 'cache-manager';
import { SocketService } from '../socket/socket.service';
import { SocketGuard } from '~/guards/SocketGuard';
import { MalService } from './mal.service';

@WebSocketGateway(8180, { namespace: 'mal', transports: ['websocket'] })
export class MalGateway implements OnGatewayInit {
  constructor(private malService: MalService, private socketService: SocketService) { }

  afterInit(server: Server) {
    this.socketService.malSocket = server;
  }

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('MalGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('build-auth-url')
  async buildAuthUrl() {
    this.logger.log('test');
    return this.malService.getAuthUrl();
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('login')
  async login(@MessageBody() { authCode, codeVerifier }: { authCode: string, codeVerifier: string }) {
    this.malService.getAuthToken(authCode, codeVerifier);
  }
}
