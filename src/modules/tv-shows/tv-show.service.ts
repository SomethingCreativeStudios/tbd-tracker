import { Injectable } from '@nestjs/common';
import { TvShowRepository } from './tv-show.repository';
import { TvShow } from './models/tv-show.enitity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TvShowService {
  constructor(@InjectRepository(TvShow) private readonly tvShowRepository: TvShowRepository) {}

  public async doTheThing() {
    return 'thing';
  }
}
