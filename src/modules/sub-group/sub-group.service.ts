import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRepository } from './sub-group.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';
import { uniq } from 'ramda';
import { CreateSubGroupDTO } from './dtos/CreateSubGroupDTO';
import { UpdateSubGroupDTO } from './dtos/UpdateSubGroupDTO';
import { SeriesService } from '../series/series.service';

@Injectable()
export class SubGroupService {
  constructor(
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: SubGroupRepository,
    private readonly subgroupRuleService: SubGroupRuleService,

    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,
  ) { }

  public async create(subGroup: CreateSubGroupDTO) {
    const series = await this.seriesService.findById(subGroup.seriesId);
    return this.subgroupRepository.save({ series, name: subGroup.name, preferedResultion: subGroup.preferedResultion });
  }

  public async createAll(subGroups: CreateSubGroupDTO[]) {
    const prom = subGroups.map((group) => this.create(group));
    return Promise.all(prom);
  }

  public async update(updateModel: UpdateSubGroupDTO) {
    const foundGroup = await this.subgroupRepository.findOne({ where: { id: updateModel.id } });

    return this.subgroupRepository.save({ ...foundGroup, ...updateModel });
  }

  public async findById(id: number) {
    return this.subgroupRepository.findOne({ where: { id } });
  }

  public async delete(deleteId: number) {
    const foundGroup = await this.subgroupRepository.findOne({ where: { id: deleteId }, relations: ['rules'] });
    const rules = (foundGroup.rules || []).map((rule) => this.subgroupRuleService.delete(rule.id));

    await Promise.all(rules);

    return this.subgroupRepository.delete({ id: deleteId });
  }

  public async findBySeries(seriesId: number) {
    return this.subgroupRepository.createQueryBuilder().where('"seriesId" = :id', { id: seriesId }).getMany();
  }

  public async findNames() {
    try {
      const results = await this.subgroupRepository.createQueryBuilder().select('name').getRawMany();

      return uniq((results || []).map(({ name }) => name));
    } catch {
      return [];
    }
  }

  public matchesSubgroup(text: string, subgroup: SubGroup) {
    if (subgroup.rules.length === 0) {
      return true;
    }

    const positiveRules = subgroup.rules.filter((rule) => rule.isPositive);
    const negativeRules = subgroup.rules.filter((rule) => !rule.isPositive);

    const search = (rule) => this.subgroupRuleService.matchRule(text, rule, subgroup);

    const positivePassed = positiveRules.length === 0 || positiveRules.some(search);
    const negativePassed = negativeRules.length === 0 || !negativeRules.some(search);

    return positivePassed && negativePassed;
  }
}
