import { TypeOrmModule } from '@nestjs/typeorm';
import { TvShow } from './models/tv-show.enitity';
import { TvShowService } from './tv-show.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([TvShow])],
  providers: [TvShowService],
  exports: [TvShowService],
})
export class TvShowModule {}
