import { Injectable } from '@nestjs/common';
import { SubGroupRule, RuleType } from './models';
import { SubGroupRuleRepository } from './sub-group-rule.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial } from 'typeorm';
import { SubGroup } from '../sub-group/models';

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

  public async findOne(subGroupRule: DeepPartial<SubGroupRule>) {
    return (await this.find(subGroupRule))[0];
  }

  public async findAll() {
    return this.subgroupRuleRepository.find();
  }

  public matchRule(text: string, rule: SubGroupRule, subgroup: SubGroup) {
    const treatedText = text
      .toLowerCase()
      .replace(`[${subgroup.name.toLowerCase()}]`, '')
      .trim();
    const ruleText = rule.text.trim().toLowerCase();

    if (!this.matchedResolutions(text, subgroup.preferedResultion)) {
      return false;
    }

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

  private matchedResolutions(text: string, preferredResolution: string) {
    const allResolutions = ['480', '540', '720', '1080', '480p', '540p', '720p', '1080p', '360', '360p'];

    if (text.includes(`[${preferredResolution}]`) || text.includes(`[${preferredResolution}p]`)) {
      return true;
    }

    return !allResolutions.some(res => text.includes(`[${res}]`));
  }
}
