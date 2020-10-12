import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesModule } from '../series/series.module';
import { Season } from './models/season.entity';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';

@Module({
  imports: [TypeOrmModule.forFeature([Season]), forwardRef(() => SeriesModule)],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}
