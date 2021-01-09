import { Module, HttpModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './models';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { SeasonModule } from '../season/season.module';
import { SubgroupModule } from '../sub-group';
import { SettingsModule } from '../settings/settings.module';
import { AnimeFolderModule } from '../anime-folder/anime-folder.module';
import { SeriesGateway } from './series.gateway';
import { NyaaModule } from '../nyaa/nyaa.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Series]),
    SettingsModule,
    SocketModule,
    forwardRef(() => SubgroupModule),
    forwardRef(() => SeasonModule),
    forwardRef(() => NyaaModule),
    forwardRef(() => AnimeFolderModule),
  ],
  controllers: [SeriesController],
  providers: [SeriesService, SeriesGateway],
  exports: [SeriesService],
})
export class SeriesModule {}
