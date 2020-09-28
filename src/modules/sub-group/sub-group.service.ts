import { Injectable } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRepository } from './sub-group.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';

@Injectable()
export class SubGroupService {
  constructor(
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: SubGroupRepository,
    private readonly subgroupRuleService: SubGroupRuleService,
  ) {}

  public matchesSubgroup(text: string, subgroup: SubGroup) {
    if (subgroup.rules.length === 0) {
      return true;
    }

    const passesGood = subgroup.rules.filter(rule => rule.isPositive).some(rule => this.subgroupRuleService.matchRule(text, rule));
    const passesBad = subgroup.rules.filter(rule => !rule.isPositive).some(rule => this.subgroupRuleService.matchRule(text, rule));

    return passesGood && !passesBad;
  }
}
