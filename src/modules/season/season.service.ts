import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeriesService } from '../series/series.service';
import { Season } from './models/season.entity';
import { SeasonRepository } from './season.repository';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepository: SeasonRepository,

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

  public async findById(id: number) {
    return this.seasonRepository.findOne({ relations: ['series'], where: { id: id } });
  }

  public async findAll() {
    return this.seasonRepository.find({ relations: ['series'] });
  }
}
