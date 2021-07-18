import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { SeasonName } from '~/modules/season/models';

export class CreateBySeasonDTO {
  @IsEnum(SeasonName)
  seasonName: SeasonName;

  @IsNumber()
  seasonYear: number;

  @IsString()
  @Type(() => Number)
  malIds: number[];
}
