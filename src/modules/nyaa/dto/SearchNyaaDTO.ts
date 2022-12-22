import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { NyaaFeed } from '../nyaa.service';

export class SearchNyaaDTO {
  @IsString()
  search: string;

  @IsEnum(NyaaFeed)
  feed: NyaaFeed;

  @IsBoolean()
  trusted: boolean;
}
