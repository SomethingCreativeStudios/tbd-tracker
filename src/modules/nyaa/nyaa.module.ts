import { Module, forwardRef } from '@nestjs/common';
import { NyaaService } from './nyaa.service';
import { SubgroupModule } from '../sub-group';
import { SeriesModule } from '../series/series.module';
import { SettingsModule } from '../settings/settings.module';
import { NyaaGateway } from './nyaa.gateway';
import { SocketModule } from '../socket/socket.module';
import { AnimeFolderModule } from '../anime-folder/anime-folder.module';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { TorrentModule } from '../torrent/torrent.module';
import { ConfigModule } from '~/config';
import { IgnoreLinkModule } from '../ignore-link/ignore-link.module';

@Module({
  imports: [SubgroupModule, forwardRef(() => SeriesModule), IgnoreLinkModule, ConfigModule, TorrentModule, SettingsModule, AnimeFolderModule, GlobalCacheModule, SocketModule],
  providers: [NyaaService, NyaaGateway],
  exports: [NyaaService],
})
export class NyaaModule {}
