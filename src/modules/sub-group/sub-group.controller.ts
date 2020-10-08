import { SubGroupService } from './sub-group.service';
import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRule } from '../sub-group-rule/models';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';
import { DeepPartial } from 'typeorm';

@ApiTags('Subgroup')
@Controller('api/v1/subgroup')
export class SubgroupController {
  constructor(private readonly subgroupService: SubGroupService, private readonly subgroupRuleService: SubGroupRuleService) {}

  @Get()
  async findAll(): Promise<SubGroup[]> {
    return this.subgroupService.findAll();
  }

  @Put()
  async update(@Body() subgroup: SubGroup): Promise<SubGroup> {
    return this.subgroupService.update(subgroup);
  }

  @Post()
  async create(@Body() subgroup: SubGroup): Promise<SubGroup> {
    return this.subgroupService.create(subgroup);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<SubGroup> {
    const found = (await this.subgroupService.find({ id }))[0];
    return this.subgroupService.delete(found);
  }

  @Post('add/rule/:id')
  async addRule(@Param('id') id: number, @Body() rule: SubGroupRule): Promise<SubGroup> {
    const found = (await this.subgroupService.find({ id }))[0];

    if (!found) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Subgroup not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    found.rules.push(rule);

    return this.subgroupService.update(found);
  }

  @Post('rule/:id')
  async updateRule(@Param('id') id: number, @Body() rule: DeepPartial<SubGroupRule>): Promise<SubGroupRule> {
    const found = (await this.subgroupRuleService.find({ id }))[0];

    return this.subgroupRuleService.update({ ...found, ...rule } as SubGroupRule);
  }

  @Delete('rule/:id')
  async removeRule(@Param('id') id: number): Promise<SubGroupRule> {
    const found = (await this.subgroupRuleService.find({ id }))[0];
    return this.subgroupRuleService.delete(found);
  }
}
