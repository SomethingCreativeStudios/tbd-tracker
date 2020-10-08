import { Injectable } from '@nestjs/common';
import { SubGroupRule, RuleType } from './models';
import { SubGroupRuleRepository } from './sub-group-rule.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial } from 'typeorm';

@Injectable()
export class SubGroupRuleService {
  constructor(
    @InjectRepository(SubGroupRule)
    private readonly subgroupRuleRepository: SubGroupRuleRepository,
  ) {}

  public async create(subGroupRule: SubGroupRule) {
    return this.subgroupRuleRepository.save(subGroupRule);
  }

  public async update(subGroupRule: SubGroupRule) {
    return this.subgroupRuleRepository.save(subGroupRule);
  }

  public async delete(subGroupRule: SubGroupRule) {
    return this.subgroupRuleRepository.remove(subGroupRule);
  }

  public async find(subGroupRule: DeepPartial<SubGroupRule>) {
    return this.subgroupRuleRepository.find({
      where: [{ id: subGroupRule.id }, { text: subGroupRule.text }, { ruleType: subGroupRule.ruleType }],
    });
  }

  public async findAll() {
    return this.subgroupRuleRepository.find();
  }

  public matchRule(text: string, rule: SubGroupRule) {
    const treatedText = text.toLowerCase();
    const ruleText = rule.text.toLowerCase();

    if (rule.ruleType === RuleType.CONTAINS) {
      return treatedText.includes(ruleText);
    }

    if (rule.ruleType === RuleType.ENDS_WITH) {
      return treatedText.endsWith(ruleText);
    }

    if (rule.ruleType === RuleType.STARTS_WITH) {
      return treatedText.startsWith(ruleText);
    }

    if (rule.ruleType === RuleType.REGEX) {
      return treatedText.match(new RegExp(ruleText)).length > 0;
    }

    return rule.ruleType === RuleType.BLANK;
  }
}
