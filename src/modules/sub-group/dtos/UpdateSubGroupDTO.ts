import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSubGroupDTO {
  @IsNumber()
  id: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  preferedResultion?: '720' | '1080' | '480';
}
