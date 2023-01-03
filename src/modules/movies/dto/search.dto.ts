import { SourceLocation } from '../movie.service';

export interface SearchDTO {
  query: string;
  source: SourceLocation;
}
