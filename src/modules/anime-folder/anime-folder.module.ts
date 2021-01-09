import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { SeriesModule } from '../series/series.module';
import { AnimeFolderController } from './anime-folder.controller';
import { AnimeFolderService } from './anime-folder.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [forwardRef(() => SeriesModule), SettingsModule],
  controllers: [AnimeFolderController],
  providers: [AnimeFolderService],
  exports: [AnimeFolderService],
})
export class AnimeFolderModule {}
