import { Module } from '@nestjs/common';
import { AnimeFolderController } from './anime-folder.controller';
import { AnimeFolderService } from './anime-folder.service';

@Module({
  imports: [],
  controllers: [AnimeFolderController],
  providers: [AnimeFolderService],
  exports: [AnimeFolderService],
})
export class AnimeFolderModule {}
