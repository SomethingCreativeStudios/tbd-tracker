import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieDb, MovieResult } from 'moviedb-promise';
import { ConfigService } from '~/config';
import { MediaRepository } from './media.repository';
import { MediaItem } from './models/media.entity';

@Injectable()
export class MediaService {
  private api = null as MovieDb;
  private IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

  constructor(
    @InjectRepository(MediaItem)
    private readonly repo: MediaRepository,

    private readonly configService: ConfigService,
  ) {
    this.api = new MovieDb(this.configService.movieAPIKey);
  }

  async find(query: string): Promise<MediaItem[]> {
    const { results } = await this.api.searchMovie({ query });

    if (results.length > 0 || query.split(' ').length === 1) {
      return results.map((result) => this.convertToMedia(result));
    }

    const newTerm = query.split(' ');
    newTerm.pop();

    return this.find(newTerm.join(' '));
  }

  private convertToMedia(result: MovieResult) {
    const mediaItem = new MediaItem();

    mediaItem.description = result.overview;
    mediaItem.displayName = result.title;
    mediaItem.imagePath = `${this.IMAGE_PATH}/${result.poster_path}`;
    mediaItem.rating = result.popularity;
    mediaItem.releaseDate = new Date(result.release_date);

    return mediaItem;
  }
}
