import { UseGuards } from '@nestjs/common';
import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConfigService } from '~/config';
import { SocketGuard } from '~/guards/SocketGuard';
import { LibraryType, PlexService } from '../plex';

import { SocketService } from '../socket/socket.service';
import { DirectDownloadMessage, MediaType } from './models/torrent.model';
import { TorrentService } from './torrent.service';

@WebSocketGateway(8180, { namespace: 'torrent', transports: ['websocket'] })
export class TorrentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private torrentService: TorrentService, private plexService: PlexService, private configService: ConfigService, private socketService: SocketService) {}
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
  async directDownload(@MessageBody() { fileName, type, url, downloadPath }: DirectDownloadMessage) {
    console.log('downloadPath', downloadPath);

    this.torrentService.download(url, type === MediaType.MOVIE ? this.configService.baseMovieFolder : downloadPath || this.configService.baseTVShowFolder, fileName, null, {
      onDone: () => {
        console.log('Calling onDone');
        if (type === MediaType.MOVIE) {
          this.plexService.refresh(LibraryType.MOVIE);
        } else {
          this.plexService.refresh(LibraryType.TV_SHOW);
        }
      },
    });
  }
}
