import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SyncDTO {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  season: string;

  @IsString()
  year: string;
}

export class IgnoreItemDTO {
  @IsString()
  link: string;
}
