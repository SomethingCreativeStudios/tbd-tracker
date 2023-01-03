import { ParsedItem } from './models/parsed.model';

export interface BaseScrapper {
  search(url: string): Promise<ParsedItem[]>;
}
