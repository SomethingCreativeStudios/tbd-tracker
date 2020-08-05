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
    if (rule.ruleType === RuleType.CONTAINS) {
      return text.includes(rule.text);
    }

    if (rule.ruleType === RuleType.ENDS_WITH) {
      return text.endsWith(rule.text);
    }

    if (rule.ruleType === RuleType.STARTS_WITH) {
      return text.startsWith(rule.text);
    }

    if (rule.ruleType === RuleType.REGEX) {
      return text.match(new RegExp(rule.text));
    }
  }
}
