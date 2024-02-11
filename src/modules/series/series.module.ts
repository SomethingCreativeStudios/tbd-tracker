import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './models';
import { SeriesService } from './series.service';
import { SeasonModule } from '../season/season.module';
import { SubgroupModule } from '../sub-group';
import { SettingsModule } from '../settings/settings.module';
import { AnimeFolderModule } from '../anime-folder/anime-folder.module';
import { SeriesGateway } from './series.gateway';
import { NyaaModule } from '../nyaa/nyaa.module';
import { SocketModule } from '../socket/socket.module';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { MalModule } from '../mal/mal.module';
import { IgnoreLinkModule } from '../ignore-link/ignore-link.module';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Series]),
    SettingsModule,
    SocketModule,
    GlobalCacheModule,
    MalModule,
    IgnoreLinkModule,
    forwardRef(() => SubgroupModule),
    forwardRef(() => SubgroupRuleModule),
    forwardRef(() => SeasonModule),
    forwardRef(() => NyaaModule),
    forwardRef(() => AnimeFolderModule),
  ],
  providers: [SeriesService, SeriesGateway],
  exports: [SeriesService],
})
export class SeriesModule {}
