import { Module } from '@nestjs/common';
import { SocketModule } from '../socket/socket.module';
import { TorrentGateway } from './torrent.gateway';
import { TorrentService } from './torrent.service';

@Module({
  imports: [SocketModule],
  providers: [TorrentService, TorrentGateway],
  exports: [TorrentService],
})
export class TorrentModule {}
