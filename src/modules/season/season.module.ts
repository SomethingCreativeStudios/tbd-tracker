import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesModule } from '../series/series.module';
import { Season } from './models/season.entity';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Season]), forwardRef(() => SeriesModule), SettingsModule],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}
