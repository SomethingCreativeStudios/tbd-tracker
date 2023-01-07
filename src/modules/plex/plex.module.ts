import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '~/config';
import { PlexService } from './plex.service';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { SocketModule } from '../socket/socket.module';
import { PlexGateway } from './plex.gateway';

@Module({
  imports: [GlobalCacheModule, SocketModule, ConfigModule, HttpModule],
  providers: [PlexService, PlexGateway],
  exports: [PlexService],
})
export class PlexModule {}
