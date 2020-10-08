import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial } from 'typeorm';
import { Series } from './models/series.entitiy';
import { SeriesRepository } from './series.repository';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: SeriesRepository,
  ) {}

  public async create(series: Series) {
    return this.seriesRepository.save(series);
  }

  public async update(series: Series) {
    return this.seriesRepository.save(series);
  }

  public async delete(series: Series) {
    return this.seriesRepository.remove(series);
  }

  public async deketeById(id: number) {
    const series = await this.seriesRepository.findOne({ relations: ['season'], where: { id: id } });
    return this.delete(series);
  }

  public async findBySeason(name: string, year: number) {
    return this.seriesRepository.find({
      relations: ['season'],
      where: [{ season: { year: year, name: name } }],
    });
  }

  public async findAll() {
    return this.seriesRepository.find({ relations: ['season'] });
  }
}
