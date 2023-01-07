import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { PlexModule } from '../plex';
import { SocketModule } from '../socket/socket.module';
import { TorrentGateway } from './torrent.gateway';
import { TorrentService } from './torrent.service';

@Module({
  imports: [GlobalCacheModule, SocketModule, PlexModule],
  providers: [TorrentService, TorrentGateway],
  exports: [TorrentService],
})
export class TorrentModule {}
