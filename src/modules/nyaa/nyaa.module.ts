import { Module, forwardRef } from '@nestjs/common';
import { NyaaController } from './nyaa.controller';
import { NyaaService } from './nyaa.service';
import { SubgroupModule } from '../sub-group';
import { SeriesModule } from '../series/series.module';
import { SettingsModule } from '../settings/settings.module';
import { NyaaGateway } from './nyaa.gateway';
import { SocketModule } from '../socket/socket.module';
import { AnimeFolderModule } from '../anime-folder/anime-folder.module';

@Module({
  imports: [SubgroupModule, forwardRef(() => SeriesModule), SettingsModule, AnimeFolderModule, SocketModule],
  controllers: [NyaaController],
  providers: [NyaaService, NyaaGateway],
  exports: [NyaaService],
})
export class NyaaModule {}
