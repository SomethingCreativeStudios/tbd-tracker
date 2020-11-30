import { Module, HttpModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './models';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { SeasonModule } from '../season/season.module';
import { SubgroupModule } from '../sub-group';
import { SettingsModule } from '../settings/settings.module';
import { AnimeFolderModule } from '../anime-folder/anime-folder.module';

@Module({
  imports: [TypeOrmModule.forFeature([Series]), forwardRef(() => SeasonModule), SubgroupModule, SettingsModule, forwardRef(() => AnimeFolderModule)],
  controllers: [SeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}
