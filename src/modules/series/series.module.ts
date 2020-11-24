import { Module, HttpModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './models';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { SeasonModule } from '../season/season.module';
import { SubgroupModule } from '../sub-group';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Series]), forwardRef(() => SeasonModule), SubgroupModule, SettingsModule],
  controllers: [SeriesController],
  providers: [SeriesService],
  exports: [SeriesService],
})
export class SeriesModule {}