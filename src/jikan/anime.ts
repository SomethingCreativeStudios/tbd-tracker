// Imports
import ow from 'ow';
import fetch from 'node-fetch';

// Interfaces
import { AnimeById } from './interfaces/anime/ById';
import { baseUrl } from './utils';

/**
 * Fetches the anime with the given ID
 *
 * @param id - The anime id
 */
const byId = async (id: number) => {
  const reqest = await fetch(`${baseUrl}/anime/${id}`, { method: 'GET' });
  return (await reqest.json()) as AnimeById;
};

export default {
  byId,
};
