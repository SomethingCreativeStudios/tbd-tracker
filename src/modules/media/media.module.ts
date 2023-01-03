import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../config';
import { MediaService } from './media.service';
import { MediaItem } from './models/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaItem]), ConfigModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
