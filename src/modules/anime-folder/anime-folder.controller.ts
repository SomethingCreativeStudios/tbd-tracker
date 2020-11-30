import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Post('/:seriesId')
  public async createFolder(@Param('seriesId') id: string, @Body() body: { folderName: string }) {
    return this.animeFolderService.createFolder(+id, body?.folderName);
  }
}
