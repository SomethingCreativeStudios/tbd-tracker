import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { SeriesModule } from '../series/series.module';
import { AnimeFolderController } from './anime-folder.controller';
import { AnimeFolderService } from './anime-folder.service';

@Module({
  imports: [forwardRef(() => SeriesModule)],
  controllers: [AnimeFolderController],
  providers: [AnimeFolderService],
  exports: [AnimeFolderService],
})
export class AnimeFolderModule {}
