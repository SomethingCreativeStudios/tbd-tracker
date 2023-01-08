import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as similarity from 'string-similarity';
import sanitizeFilename from 'sanitize-filename';
import { RuleType } from '../sub-group-rule/models';
import { AnimeFolderRule } from './models';
import { existsSync, mkdirSync, readdirSync, ensureDirSync, copy, move } from 'fs-extra';
import { ConfigService } from '../../config';
import { SeriesService } from '../series/series.service';
import { SettingsService } from '../settings/settings.service';
import { join } from 'path';
import { SeasonName } from '../season/models';
import { Series } from '../series/models';

@Injectable()
export class AnimeFolderService {
  constructor(
    private configService: ConfigService,

    private settingsService: SettingsService,

    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,
  ) { }

  public async getCurrentFolder(season?: string, year?: string) {
    const currentYear = year || (await this.settingsService.findByKey('currentYear'))?.value || "2022";
    const currentSeason = season || (await this.settingsService.findByKey('currentSeason'))?.value || "winter";

    return join(this.configService.baseFolder, currentYear, currentSeason as any);
  }

  public async ensureShowFolder(name: string, season?: string, year?: string) {
    ensureDirSync(join(await this.getCurrentFolder(season, year), sanitizeFilename(name)));
  }

  public async getFolders() {
    const currentPath = await this.getCurrentFolder();

    ensureDirSync(currentPath);

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

  public async migrateSeries(currentFolder: string, currentSeason: SeasonName, currentYear: number, season: SeasonName, year: number) {
    const folderPath = join(this.configService.baseFolder, String(currentYear), currentSeason, currentFolder);

    if (!existsSync(folderPath)) {
      console.log('Folder not found:', folderPath);
      return;
    }

    const newFolder = await this.getCurrentFolder(season, String(year));
    ensureDirSync(newFolder);

    await move(folderPath, join(newFolder, currentFolder), { overwrite: true });
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
