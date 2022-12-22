import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { WatchingStatus } from '../models';

export class CreateSeriesDTO {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  imageUrl: string;

  @IsEnum(WatchingStatus)
  watchStatus: WatchingStatus;

  @IsOptional()
  @IsString()
  showName?: string;

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
}
