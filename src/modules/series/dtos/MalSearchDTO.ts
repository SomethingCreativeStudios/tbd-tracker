import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SeasonName } from '~/modules/season/models';

export class MalSearchDTO {
  @IsEnum(SeasonName)
  @IsOptional()
  season?: SeasonName;

  @IsNumber()
  @IsOptional()
  year?: number;
}
