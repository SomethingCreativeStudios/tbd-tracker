import { Controller, Get, Query, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NyaaService, NyaaFeed } from './nyaa.service';
import { NyaaItem } from './models/nyaaItem';
import { SubGroupService } from '../sub-group';
import { SeriesService } from '../series/series.service';
import { resolve } from 'path';

@ApiTags('Nyaa')
@Controller('api/v1/nyaa')
export class NyaaController {
  constructor(
    private readonly nyaaService: NyaaService,
    private readonly seriesService: SeriesService,
    private readonly subgroupService: SubGroupService,
  ) {}

  @Get('/feed')
  public async getNyaaFeed(): Promise<NyaaItem[]> {
    return this.nyaaService.fetchItems(NyaaFeed.ANIME);
  }

  @Post('/download')
  public async download(@Body() { seriesId, url, name }: { url: string; seriesId: number; name: string }) {
    const series = await this.seriesService.findById(seriesId);

    await this.nyaaService.downloadShow(url, resolve(process.env.BASE_FOLDER, series.folderPath), name);
  }

  @Post('/download/test')
  public async downloadTest() {
    await this.nyaaService.testDownload();
  }

  @Get('/feed/filtered')
  public async getNyaaFeedFiltered(): Promise<NyaaItem[]> {
    const feed = await this.nyaaService.fetchItems(NyaaFeed.ANIME);
    const allGroups = await this.subgroupService.findAll();

    return feed.filter(item => this.nyaaService.isValidItem(item, allGroups));
  }

  @Put('/feed/sync/:id')
  public async syncShow(@Param('id') id: string) {
    await this.nyaaService.syncById(+id);
  }

  @Put('/feed/sync')
  public async syncShows() {
    await this.nyaaService.syncShows();
  }

  @Get('/feed/query')
  @ApiQuery({ name: 'search' })
  @ApiQuery({ name: 'feed', enum: NyaaFeed })
  @ApiQuery({ name: 'trusted' })
  public async searchNyaa(
    @Query('search') search: string,
    @Query('feed') feed: NyaaFeed,
    @Query('trusted') trusted: boolean = false,
  ): Promise<NyaaItem[]> {
    return this.nyaaService.searchItems(feed, search, trusted);
  }
}
