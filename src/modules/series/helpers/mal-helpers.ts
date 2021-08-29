import { ensureDirSync } from 'fs-extra';
import { join } from 'path';
import sanitizeFilename from 'sanitize-filename';
import { Anime, Search } from '../../../jikan';
import { AnimeById } from '../../../jikan/interfaces/anime/ById';
import { Anime as AnimeSeason } from '../../../jikan/interfaces/season/Season';
import { Series, WatchingStatus } from '../models';

export async function findFromMAL(seriesName: string, currentFolder: string) {
  const foundAnime = await Search.search(seriesName, 'anime', 1);

  if ((foundAnime?.results?.length ?? 0) === 0) {
    throw Error('Show Not Found');
  }

  const anime = await Promise.all(foundAnime.results.map((result) => Anime.byId(result.mal_id)));
  const newSeries = await Promise.all(anime.map((animeById) => createFromMAL(animeById, currentFolder)));

  return newSeries.filter((show) => show.imageUrl);
}

export async function createFromMALName(seriesName: string, currentFolder: string) {
  const foundAnime = await Search.search(seriesName, 'anime', 1);

  if ((foundAnime?.results?.length ?? 0) === 0) {
    throw Error('Show Not Found');
  }

  return createFromMAL(await Anime.byId(foundAnime.results[0].mal_id), currentFolder);
}

export async function createFromMALSeason(animeModel: AnimeSeason, currentFolder: string, options: { autoMatchFolders: boolean }) {
  const series = new Series();

  series.airingData = new Date(animeModel.airing_start) || new Date();
  series.description = animeModel.synopsis;
  series.genres = animeModel?.genres?.map((genre) => genre.name) ?? [];
  series.imageUrl = animeModel.image_url;
  series.name = animeModel.title;
  series.otherNames = [];
  series.numberOfEpisodes = animeModel.episodes || 0;
  series.score = animeModel.score;
  series.studio = animeModel.licensors?.join(' ') ?? '';
  series.continuing = animeModel.continuing;
  series.tags = [];
  series.watchStatus = WatchingStatus.THREE_RULE;
  series.malId = animeModel.mal_id;

  if (options.autoMatchFolders) {
    series.folderPath = autoMakeFolder(series.name, currentFolder);
  }

  return series;
}

export async function createFromMAL(animeModel: AnimeById, currentFolder: string, options?: { autoMatchFolders: boolean }) {
  const series = new Series();

  series.airingData = new Date(animeModel?.aired?.from ?? new Date()) || new Date();
  series.description = animeModel.synopsis;
  series.genres = animeModel?.genres?.map((genre) => genre.name) ?? [];
  series.imageUrl = animeModel.image_url;
  series.name = animeModel.title;
  series.otherNames = [animeModel.title_english, animeModel.title_japanese, ...(animeModel?.title_synonyms ?? [])];
  series.numberOfEpisodes = animeModel.episodes || 0;
  series.score = animeModel.score;
  series.studio = animeModel?.studios?.map(({ name }) => name).join(' ') ?? '';
  series.tags = [];
  series.watchStatus = WatchingStatus.THREE_RULE;
  series.malId = animeModel.mal_id;

  if (options?.autoMatchFolders) {
    series.folderPath = autoMakeFolder(series.name, currentFolder);
  }

  return series;
}

function autoMakeFolder(seriesName: string, currentFolder: string) {
  console.log('Auto Make', seriesName);
  const cleanName = sanitizeFilename(seriesName);
  const folderName = join(currentFolder, cleanName);

  ensureDirSync(folderName);

  return cleanName;
}
