import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SeasonName } from '~/modules/season/models';

export class MigrateSeriesDTO {
  @IsNumber()
  id: number;

  @IsEnum(SeasonName)
  season: SeasonName;

  @IsNumber()
  year: number;
}
