// Imports
import fetch from 'node-fetch';

// Interfaces
import { Season, Seasons } from './interfaces/season/Season';
import { SeasonArchive } from './interfaces/season/SeasonArchive';
import { SeasonLater } from './interfaces/season/SeasonLater';

// Utils
import { api, Logger, queue, baseUrl } from './utils';

/**
 * Fetches anime of the specified season
 *
 * @param year - The wanted year
 * @param season - The wanted season
 */
const anime = async (year: number, season: Seasons) => {
  try {
    const reqest = await fetch(`${baseUrl}/season/${year}/${season}`, { method: 'GET' });
    return (await reqest.json()) as Season;
  } catch (error) {
    Logger.error(error);
  }
};

/**
 * Feteches all the years & their respective seasons that can be parsed from MyAnimeList
 */
const archive = async () => {
  try {
    const reqest = await fetch(`${baseUrl}/season/archive`, { method: 'GET' });
    return (await reqest.json()) as SeasonArchive;
  } catch (error) {
    Logger.error(error);
  }
};

/**
 * Fetches anime that have been announced for the upcoming seasons
 */
const later = async () => {
  try {
    const reqest = await fetch(`${baseUrl}/season/later`, { method: 'GET' });
    return (await reqest.json()) as SeasonLater;
  } catch (error) {
    Logger.error(error);
  }
};

export default {
  anime,
  archive,
  later,
};
