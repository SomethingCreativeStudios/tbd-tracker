import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NyaaItem } from '~/modules/nyaa/models/nyaaItem';
import { WatchingStatus } from '../models';

export class UpdateSeriesDTO {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(WatchingStatus)
  watchStatus?: WatchingStatus;

  @IsOptional()
  @IsString()
  showName?: string;

  @IsOptional()
  @IsNumber()
  malId?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsDate()
  airingData?: Date;

  @IsOptional()
  @IsNumber()
  numberOfEpisodes?: number;

  @IsOptional()
  @IsNumber()
  downloaded?: number;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  otherNames?: string[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  genres?: string[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  tags?: string[];

  @IsOptional()
  @IsString()
  studio?: string;

  @IsOptional()
  @IsString()
  folderPath?: string;

  @IsOptional()
  @IsArray()
  @Type(() => NyaaItem)
  showQueue?: NyaaItem[];
}
