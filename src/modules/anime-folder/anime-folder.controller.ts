import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AnimeFolderService } from './anime-folder.service';

@ApiTags('Anime Folder')
@Controller('api/v1/anime-folder')
export class AnimeFolderController {
  constructor(private readonly animeFolderService: AnimeFolderService) {}

  @Get()
  public async getFolders() {
    return this.animeFolderService.getFolders();
  }
}
