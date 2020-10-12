import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeriesService } from '../series/series.service';
import { Season, SeasonName } from './models/season.entity';
import { Season as SeasonSearch } from '../../jikan';
import { SeasonRepository } from './season.repository';
import { differenceInCalendarYears, format } from 'date-fns';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepository: SeasonRepository,

    @Inject(forwardRef(() => SeriesService))
    private readonly seriesService: SeriesService,
  ) {}

  public async create(season: Season) {
    return this.seasonRepository.save(season);
  }

  public async update(season: Season) {
    return this.seasonRepository.save(season);
  }

  public async delete(season: Season) {
    const deletes = season.series.map(series => {
      return this.seriesService.delete(series);
    });

    await Promise.all(deletes);

    return this.seasonRepository.remove(season);
  }

  public async generateFromSeason(seasonName: SeasonName, year: number) {
    const newSeason = await this.find(seasonName, year);
    const season = await SeasonSearch.anime(year, seasonName);
    const hasEps = (eps = 0) => eps === 0 || eps > 4;
    newSeason.series = season.anime
      .map(anime => this.seriesService.createFromMALSeason(anime))
      .filter(show => !show.continuing && hasEps(show.numberOfEpisodes) && differenceInCalendarYears(new Date(), show.airingData) < 1);

    return this.update(newSeason);
  }

  public async findById(id: number) {
    return this.seasonRepository.findOne({ relations: ['series'], where: { id } });
  }

  public async find(season: SeasonName, year: number, createIfNotFound: boolean = true) {
    const found = await this.seasonRepository.findOne({ relations: ['series'], where: { year, name: season } });

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
