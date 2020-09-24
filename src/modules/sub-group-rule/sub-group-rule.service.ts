import { Injectable } from '@nestjs/common';
import { SubGroupRule, RuleType } from './models';
import { SubGroupRuleRepository } from './sub-group-rule.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SubGroupRuleService {
  constructor(
    @InjectRepository(SubGroupRule)
    private readonly subgroupRuleRepository: SubGroupRuleRepository,
  ) {}

  public matchRule(text: string, rule: SubGroupRule) {
    let result = true;
    const treatedText = text.toLowerCase();
    const ruleText = rule.text.toLowerCase();

    if (rule.ruleType === RuleType.CONTAINS) {
      result = treatedText.includes(ruleText);
    }

    if (rule.ruleType === RuleType.ENDS_WITH) {
      result = treatedText.endsWith(ruleText);
    }

    if (rule.ruleType === RuleType.STARTS_WITH) {
      result = treatedText.startsWith(ruleText);
    }

    if (rule.ruleType === RuleType.REGEX) {
      result = treatedText.match(new RegExp(ruleText)).length > 0;
    }

    return rule.ruleJoin ? result : !result;
  }
}
