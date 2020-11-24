import { Module } from '@nestjs/common';
import { NyaaController } from './nyaa.controller';
import { NyaaService } from './nyaa.service';
import { SubgroupModule } from '../sub-group';
import { SeriesModule } from '../series/series.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SubgroupModule, SeriesModule, SettingsModule],
  controllers: [NyaaController],
  providers: [NyaaService],
  exports: [NyaaService],
})
export class NyaaModule {}
