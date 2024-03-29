import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeriesService } from '../series/series.service';
import { Season, SeasonName } from './models/season.entity';
import { SeasonRepository } from './season.repository';
import { SettingsService } from '../settings/settings.service';
import { SubGroup } from '../sub-group/models';
import { SubGroupRule, RuleType } from '../sub-group-rule/models';
import { MalService } from '../mal';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepository: SeasonRepository,

    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,

    private readonly settingsService: SettingsService,

    private readonly malService: MalService,
  ) { }

  public async create(season: Season) {
    return this.seasonRepository.save(season);
  }

  public async update(season: Season) {
    const { value: subgroupName } = await this.settingsService.findByKey('defaultSubgroup');

    season.series.forEach((series) => {
      if (!series.subgroups || series.subgroups.length === 0) {
        const subGroup = new SubGroup();

        subGroup.name = subgroupName;
        subGroup.preferedResultion = '720';

        const rule = new SubGroupRule();
        rule.isPositive = true;
        rule.ruleType = RuleType.STARTS_WITH;
        rule.text = series.name;

        subGroup.addRule(rule);

        series.subgroups = [subGroup];
      }
    });

    return this.seasonRepository.save(season);
  }

  public async delete(season: Season) {
    const deletes = season.series.map((series) => {
      return this.seriesService.deleteById(series.id);
    });

    await Promise.all(deletes);

    return this.seasonRepository.remove(season);
  }

  public async generateFromSeason(seasonName: SeasonName, year: number, options: any) {
    const newSeason = await this.find(seasonName, year);
    const hasEps = (eps = 0) => eps === 0 || eps > 4;

    const promisedSeries = await this.malService.searchSeason(year + '', seasonName, true);

    newSeason.series = promisedSeries.filter((show) => !show.continuing && hasEps(show.numberOfEpisodes));

    return this.update(newSeason);
  }

  public async findById(id: number) {
    return this.seasonRepository.findOne({ relations: ['series'], where: { id } });
  }

  public async find(season: SeasonName, year: number, createIfNotFound: boolean = true) {
    const found = await this.seasonRepository.findOne({
      relations: ['series', 'series.subgroups', 'series.subgroups.rules'],
      where: { year, name: season },
    });

    const newSeason = new Season();
    newSeason.name = season;
    newSeason.year = year;
    newSeason.overallScore = 0;

    return createIfNotFound ? found || this.create(newSeason) : found;
  }

  public async findAll() {
    return this.seasonRepository.find({ relations: ['series'] });
  }
}
