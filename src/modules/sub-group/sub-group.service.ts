import { Injectable } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRepository } from './sub-group.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';
import { DeepPartial } from 'typeorm';
import { uniq } from 'ramda';
import { CreateSubGroupDTO } from './dtos/CreateSubGroupDTO';
import { UpdateSubGroupDTO } from './dtos/UpdateSubGroupDTO';

@Injectable()
export class SubGroupService {
  constructor(
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: SubGroupRepository,
    private readonly subgroupRuleService: SubGroupRuleService,
  ) {}

  public async create(subGroup: CreateSubGroupDTO) {
    return this.subgroupRepository.save(subGroup);
  }

  public async createAll(subGroups: CreateSubGroupDTO[]) {
    const prom = subGroups.map((group) => this.create(group));
    return Promise.all(prom);
  }

  public async update(updateModel: UpdateSubGroupDTO) {
    const foundGroup = await this.subgroupRepository.findOne({ id: updateModel.id });

    return this.subgroupRepository.save({ ...foundGroup, ...updateModel });
  }

  public async findById(id: number) {
    return this.subgroupRepository.findOne({ id });
  }

  public async delete(deleteId: number) {
    const foundGroup = await this.subgroupRepository.findOne({ id: deleteId }, { relations: ['rules'] });
    const rules = (foundGroup.rules || []).map((rule) => this.subgroupRuleService.delete(rule.id));

    await Promise.all(rules);

    return this.subgroupRepository.delete({ id: deleteId });
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

    const goodRules = subgroup.rules.filter((rule) => rule.isPositive);
    const badRules = subgroup.rules.filter((rule) => !rule.isPositive);

    const passesGood = goodRules.every((rule) => this.subgroupRuleService.matchRule(text, rule, subgroup));
    const passesBad = badRules.every((rule) => this.subgroupRuleService.matchRule(text, rule, subgroup));

    return passesGood && (badRules.length > 0 ? !passesBad : true);
  }
}
