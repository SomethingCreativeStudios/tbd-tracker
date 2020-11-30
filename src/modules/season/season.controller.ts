import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Series } from '../series/models/series.entity';
import { SeriesService } from '../series/series.service';
import { Season, SeasonName } from './models/season.entity';
import { SeasonService } from './season.service';

@ApiTags('Season')
@Controller('api/v1/season')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService, private readonly seriesService: SeriesService) {}

  @Get()
  async findAll(): Promise<Season[]> {
    return this.seasonService.findAll();
  }

  @Put()
  async update(@Body() season: Season): Promise<Season> {
    return this.seasonService.update(season);
  }

  @Post()
  async create(@Body() season: Season): Promise<Season> {
    return this.seasonService.create(season);
  }

  @Post('mal/:year/:seasonName')
  async createFromSeason(
    @Param('year') year: number,
    @Param('seasonName') seasonName: SeasonName,
    @Body() options: { autoMatchFolders: boolean },
  ): Promise<Season> {
    return this.seasonService.generateFromSeason(seasonName, year, options);
  }

  @Post('/series/:seasonId')
  async addSeries(@Param('season') seasonId: number, @Body() series: Series): Promise<Season> {
    const season = await this.seasonService.findById(seasonId);

    season.series.push(series);

    return this.seasonService.update(season);
  }

  @Delete('/series/:seasonId/:seriesId')
  async removeSeries(@Param('season') seasonId: number, @Param('seriesId') seriesId: number): Promise<Season> {
    await this.seriesService.deketeById(seriesId);

    return this.seasonService.findById(seasonId);
  }
}
