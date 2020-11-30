import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as similarity from 'string-similarity';
import { RuleType } from '../sub-group-rule/models';
import { AnimeFolderRule } from './models';
import { existsSync, mkdirSync, readdirSync } from 'fs-extra';
import { ConfigService } from '../../config';
import { SeriesService } from '../series/series.service';
import sanitize from 'sanitize-filename';

@Injectable()
export class AnimeFolderService {
  constructor(
    private configService: ConfigService,

    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,
  ) {}

  public getFolders() {
    return readdirSync(this.configService.baseFolder, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  public async createFolder(seriesId: number, folderName?: string) {
    const series = await this.seriesService.findById(seriesId);

    const folderPath = folderName ? process.env.BASE_FOLDER + '\\' + folderName : process.env.BASE_FOLDER + '\\' + sanitize(series.name);

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }

    return folderName || sanitize(series.name);
  }

  public autoMakeFolder(seriesName: string) {
    const folderNames = this.getFolders();
    const { bestMatch } = similarity.findBestMatch(seriesName, folderNames) || {};

    if (bestMatch?.rating >= 0.7) {
      return bestMatch.target;
    }

    const cleanName = sanitize(seriesName);
    const folderName = process.env.BASE_FOLDER + '\\' + cleanName;

    if (!existsSync(folderName)) {
      mkdirSync(folderName);
    }

    return cleanName;
  }

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
