import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Series, WatchingStatus } from './models';
import { SeriesRepository } from './series.repository';
import { AnimeById } from 'jikants/dist/src/interfaces/anime/ById';
import { Search, Anime } from '../../jikan';
import { SeasonService } from '../season/season.service';
import { Anime as AnimeSeason } from '../../jikan/interfaces/season/Season';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: SeriesRepository,

    @Inject(forwardRef(() => SeasonService))
    private seasonService: SeasonService,
  ) {}

  public async create(series: Series) {
    return this.seriesRepository.save(series);
  }

  public async findFromMAL(seriesName: string) {
    const foundAnime = await Search.search(seriesName, 'anime', 1);

    if ((foundAnime?.results?.length ?? 0) === 0) {
      throw Error('Show Not Found');
    }

    return (await Promise.all(foundAnime.results.map(async result => this.createFromMAL(await Anime.byId(result.mal_id))))).filter(
      show => show.imageUrl,
    );
  }

  public async createFromMALName(seriesName: string) {
    const foundAnime = await Search.search(seriesName, 'anime', 1);

    if ((foundAnime?.results?.length ?? 0) === 0) {
      throw Error('Show Not Found');
    }

    return this.createFromMAL(await Anime.byId(foundAnime.results[0].mal_id));
  }

  public async createFromMALId(id: number) {
    return this.createFromMAL(await Anime.byId(id));
  }

  public async update(series: Series) {
    return this.seriesRepository.save(series);
  }

  public async delete(series: Series) {
    return this.seriesRepository.remove(series);
  }

  public async deketeById(id: number) {
    const series = await this.seriesRepository.findOne({ relations: ['season', 'subgroups'], where: { id: id } });
    return this.delete(series);
  }

  public async findBySeason(name: string, year: number) {
    return this.seriesRepository.find({
      relations: ['season'],
      where: [{ season: { year: year, name: name } }],
    });
  }

  public async findAll() {
    return this.seriesRepository.find({ relations: ['season', 'subgroups', 'subgroups.rules'] });
  }

  public async findById(seriesId: number) {
    return this.seriesRepository.findOne({ relations: ['season', 'subgroups', 'subgroups.rules'], where: { id: seriesId } });
  }

  public createFromMALSeason(animeModel: AnimeSeason) {
    const series = new Series();

    series.airingData = new Date(animeModel.airing_start) || new Date();
    series.description = animeModel.synopsis;
    series.genres = animeModel?.genres?.map(genre => genre.name) ?? [];
    series.imageUrl = animeModel.image_url;
    series.name = animeModel.title;
    series.otherNames = [];
    series.numberOfEpisodes = animeModel.episodes || 0;
    series.score = animeModel.score;
    series.studio = animeModel.licensors?.join(' ') ?? '';
    series.continuing = animeModel.continuing;
    series.tags = [];
    series.watchStatus = WatchingStatus.NOT_WATCHING;

    return series;
  }

  public createFromMAL(animeModel: AnimeById) {
    const series = new Series();

    series.airingData = new Date(animeModel?.aired?.from ?? new Date()) || new Date();
    series.description = animeModel.synopsis;
    series.genres = animeModel?.genres?.map(genre => genre.name) ?? [];
    series.imageUrl = animeModel.image_url;
    series.name = animeModel.title;
    series.otherNames = [animeModel.title_english, animeModel.title_japanese, ...(animeModel?.title_synonyms ?? [])];
    series.numberOfEpisodes = animeModel.episodes || 0;
    series.score = animeModel.score;
    series.studio = animeModel?.studios?.map(({ name }) => name).join(' ') ?? '';
    series.tags = [];
    series.watchStatus = WatchingStatus.NOT_WATCHING;

    return series;
  }
}
