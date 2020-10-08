import { Injectable } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRepository } from './sub-group.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';
import { DeepPartial } from 'typeorm';

@Injectable()
export class SubGroupService {
  constructor(
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: SubGroupRepository,
    private readonly subgroupRuleService: SubGroupRuleService,
  ) {}

  public async create(subGroup: SubGroup) {
    return this.subgroupRepository.save(subGroup);
  }

  public async update(subGroup: SubGroup) {
    return this.subgroupRepository.save(subGroup);
  }

  public async delete(subGroup: SubGroup) {
    const deletes = subGroup.rules.map(rule => {
      return this.subgroupRuleService.delete(rule);
    });

    await Promise.all(deletes);

    return this.subgroupRepository.remove(subGroup);
  }

  public async find(subGroup: DeepPartial<SubGroup>) {
    return this.subgroupRepository.find({
      relations: ['rules'],
      where: [{ id: subGroup.id }, { name: subGroup.name }, { preferedResultion: subGroup.preferedResultion }],
    });
  }

  public async findAll() {
    return this.subgroupRepository.find({ relations: ['rules'] });
  }

  public matchesSubgroup(text: string, subgroup: SubGroup) {
    if (subgroup.rules.length === 0) {
      return true;
    }

    const passesGood = subgroup.rules.filter(rule => rule.isPositive).some(rule => this.subgroupRuleService.matchRule(text, rule));
    const passesBad = subgroup.rules.filter(rule => !rule.isPositive).some(rule => this.subgroupRuleService.matchRule(text, rule));

    return passesGood && !passesBad;
  }
}
