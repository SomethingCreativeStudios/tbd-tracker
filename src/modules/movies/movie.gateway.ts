import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../socket/socket.service';
import { SearchDTO } from './dto/search.dto';
import { SocketGuard } from '~/guards/SocketGuard';
import { MovieService, SourceLocation } from './movie.service';

@WebSocketGateway(8180, { namespace: 'movie', transports: ['websocket'] })
export class MovieGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private movieService: MovieService, private socketService: SocketService) {}
  afterInit(server: Server) {
    this.socketService.movieSocket = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('MovieGateway');

  @UseGuards(SocketGuard)
  @SubscribeMessage('search')
  async search(@MessageBody() search: SearchDTO) {
    return this.movieService.find(search.query, search.source);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('meta')
  async findMeta(@MessageBody() name: string) {
    return this.movieService.findMeta(name);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('quick-links')
  async findQuickLinks(@MessageBody() { source = SourceLocation.THE_PIRATE_BAY }: { source: SourceLocation }) {
    if (source === SourceLocation.THE_PIRATE_BAY) {
      return [
        { query: 'top100:207', display: 'Top Movies' },
        { query: 'top100:48h_207', display: 'Top Movies(48)' },
      ];
    }
    return [];
  }
}
