// Imports
import got from 'got';
import PMemoize from 'p-memoize';
import PQueue from 'p-queue';
import pino from 'pino';
import LRU from 'quick-lru';

// Constants
export const baseUrl = 'https://api.jikan.moe/v3';
export const queue = new PQueue({ concurrency: 2 });

// Custom http client
// @ts-ignore
const http = got.extend({
  baseUrl,
  // @ts-ignore
  json: true,
});

// Memoized http client
// @ts-ignore
export const api = (input: string) => PMemoize(http, { cache: new LRU({ maxSize: 1000 }) })(`${baseUrl}${input}`);

// Fast JSON logger
export const Logger = pino({
  name: 'jikants',
  prettyPrint: true,
});
