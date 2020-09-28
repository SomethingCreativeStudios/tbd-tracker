import { Injectable } from '@nestjs/common';
import * as similarity from 'string-similarity';
import { RuleType } from '../sub-group-rule/models';
import { AnimeFolderRule } from './models';

@Injectable()
export class AnimeFolderService {
  public matchFolder(showName: string, folderNames: string[], folderRules: AnimeFolderRule[]) {
    const foundRule = folderRules.find(rule => this.matchFolderRule(showName.toLowerCase(), rule));

    // Found rule, escape now!
    if (foundRule) {
      return foundRule.folderName;
    }

    const { target = '', rating = 0 } = similarity.findBestMatch(showName, folderNames)?.bestMatch ?? {};

    return rating >= 0.3 ? target : '';
  }

  private matchFolderRule(text: string, rule: AnimeFolderRule) {
    const ruleText = rule.textMatch.toLowerCase();

    if (rule.ruleType === RuleType.CONTAINS) {
      return text.includes(ruleText);
    }

    if (rule.ruleType === RuleType.ENDS_WITH) {
      return text.endsWith(ruleText);
    }

    if (rule.ruleType === RuleType.STARTS_WITH) {
      return text.startsWith(ruleText);
    }

    if (rule.ruleType === RuleType.REGEX) {
      return text.match(new RegExp(rule.textMatch)).length > 0;
    }
  }
}
