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
      return treatedText.match(new RegExp(ruleText));
    }
  }
}
