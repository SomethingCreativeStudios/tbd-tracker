import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class SuggestSubgroupDTO {
  @IsString()
  showName: string;

  @IsString()
  @Type(() => String)
  altNames: string[];
}
