import { Body, Controller, Delete, Get, Post, Put, Param, Query, ParseArrayPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Series } from './models';
import { SeriesService } from './series.service';
import { SubGroupService } from '../sub-group';
import { SubGroup } from '../sub-group/models';

@ApiTags('Series')
@Controller('api/v1/series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService, private readonly subgroupService: SubGroupService) {}

  @Get()
  async findAll(): Promise<Series[]> {
    const series = await this.seriesService.findAll();
    return series.sort((seriesA, seriesB) => (seriesA.name > seriesB.name ? 1 : -1));
  }

  @Put()
  async update(@Body() series: Series): Promise<Series> {
    return this.seriesService.update(series);
  }

  @Delete()
  async remove(@Body() series: Series): Promise<Series> {
    return this.seriesService.update(series);
  }

  @Delete('/:id')
  async removeById(@Param('id') id: number): Promise<Series> {
    return this.seriesService.deketeById(id);
  }

  @Delete('/all/:ids')
  async removeByIds(@Param('ids', ParseArrayPipe) ids: number[]) {
    ids.forEach(id => this.seriesService.deketeById(id));
  }

  @Post()
  async create(@Body() series: Series): Promise<Series> {
    return this.seriesService.create(series);
  }

  @Post('/mal/:id')
  async createByMal(@Param('id') id: number): Promise<Series> {
    const series = await this.seriesService.createFromMALId(id);

    return this.seriesService.create(series);
  }

  @Get('/mal/:showName')
  async findByMal(@Param('showName') showName: string): Promise<Series[]> {
    return this.seriesService.findFromMAL(showName);
  }

  @Put('/subgroup')
  async updateSubgroup(@Body() subgroup: SubGroup): Promise<SubGroup> {
    return this.subgroupService.update(subgroup);
  }

  @Put('/copy/subgroup/:seriesId')
  async copyGroups(@Param('seriesId') seriesId: number, @Body() ids: number[]): Promise<Series[]> {
    const { subgroups = [] } = await this.seriesService.findById(seriesId);

    const newGroups = subgroups.map(group => {
      return {
        ...group,
        id: undefined,
        series: undefined,
        rules: (group.rules || []).map(rule => ({ ...rule, id: undefined, subGroup: undefined })),
      };
    });

    const promIds = ids.map(async id => {
      const series = await this.seriesService.findById(id);

      if (id === seriesId) {
        return series;
      }

      const seriesGroups = newGroups.map(group => ({ ...group, series }));
      const groups = await this.subgroupService.createAll(seriesGroups as SubGroup[]);
      return this.seriesService.findById(id);
    });

    return Promise.all(promIds);
  }

  @Post('/subgroup/:seriesId')
  async addSubgroup(@Param('seriesId') seriesId: number): Promise<SubGroup> {
    const series = await this.seriesService.findById(seriesId);

    const newGroup = new SubGroup();
    newGroup.name = 'New Group';
    newGroup.preferedResultion = '720';
    newGroup.series = series;

    return this.subgroupService.create(newGroup);
  }

  @Delete('/subgroup/:subgroupId')
  async removeSubgroup(@Param('subgroupId') subgroupId: number): Promise<SubGroup> {
    const subgroup = (await this.subgroupService.find({ id: subgroupId }))[0];
    return this.subgroupService.delete(subgroup);
  }
}
