import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as similarity from 'string-similarity';
import sanitizeFilename from 'sanitize-filename';
import { RuleType } from '../sub-group-rule/models';
import { AnimeFolderRule } from './models';
import { existsSync, mkdirSync, readdirSync, ensureDirSync } from 'fs-extra';
import { ConfigService } from '../../config';
import { SeriesService } from '../series/series.service';
import { SettingsService } from '../settings/settings.service';
import { join } from 'path';

@Injectable()
export class AnimeFolderService {
  constructor(
    private configService: ConfigService,

    private settingsService: SettingsService,

    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,
  ) {}

  public async getCurrentFolder(season?: string, year?: string) {
    const currentYear = year || (await this.settingsService.findByKey('currentYear')).value;
    const currentSeason = season || (await this.settingsService.findByKey('currentSeason')).value;

    return join(this.configService.baseFolder, currentYear, currentSeason as any);
  }

  public async ensureShowFolder(name: string, season?: string, year?: string) {
    ensureDirSync(join(await this.getCurrentFolder(season, year), sanitizeFilename(name)));
  }

  public async getFolders() {
    const currentPath = await this.getCurrentFolder();

    ensureDirSync(currentPath);
    console.log(currentPath, readdirSync(currentPath, { withFileTypes: true }));
    return readdirSync(currentPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  public async createFolder(seriesId: number, folderName?: string) {
    const series = await this.seriesService.findById(seriesId);

    const folderPath = folderName ? join(await this.getCurrentFolder(), folderName) : join(await this.getCurrentFolder(), sanitizeFilename(series.name));

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath);
    }

    return folderName || sanitizeFilename(series.name);
  }

  public async autoMakeFolder(seriesName: string) {
    const cleanName = sanitizeFilename(seriesName);
    const folderName = join(await this.getCurrentFolder(), cleanName);

    ensureDirSync(folderName);

    return cleanName;
  }

  public matchFolder(showName: string, folderNames: string[], folderRules: AnimeFolderRule[]) {
    const foundRule = folderRules.find((rule) => this.matchFolderRule(showName.toLowerCase(), rule));

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
