import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Series } from './models/series.entitiy';
import { SeriesService } from './series.service';

@ApiTags('Series')
@Controller('api/v1/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

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
}
