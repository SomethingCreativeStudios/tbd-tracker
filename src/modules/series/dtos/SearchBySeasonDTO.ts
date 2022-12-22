import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SortBy } from '../models/series.entity';

export class SearchBySeasonDTO {
  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsBoolean()
  hasQueue?: boolean;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;
}
