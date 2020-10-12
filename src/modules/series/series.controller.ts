import { Body, Controller, Delete, Get, Post, Put, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Series } from './models';
import { SeriesService } from './series.service';
import { SubGroupService } from '../sub-group';

@ApiTags('Series')
@Controller('api/v1/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService, private readonly subgroupService: SubGroupService) {}

  @Get()
  async findAll(): Promise<Series[]> {
    return this.seriesService.findAll();
  }

  @Put()
  async update(@Body() series: Series): Promise<Series> {
    return this.seriesService.update(series);
  }

  @Delete()
  async remove(@Body() series: Series): Promise<Series> {
    return this.seriesService.update(series);
  }

  @Post()
  async create(@Body() series: Series): Promise<Series> {
    return this.seriesService.create(series);
  }

  @Get('mal/:showName')
  async findByMal(@Param('showName') showName: string): Promise<Series[]> {
    return this.seriesService.findFromMAL(showName);
  }

  @Put('subgroup/add/:seriesId/:groupId')
  async addSubgroup(@Param('groupId') groupId: number, @Param('seriesId') seriesId: number): Promise<Series> {
    const subgroup = await this.subgroupService.find({ id: groupId });
    const series = await this.seriesService.findById(seriesId);

    series.subgroups = (series.subgroups || []).concat(subgroup);

    return this.seriesService.update(series);
  }
}
