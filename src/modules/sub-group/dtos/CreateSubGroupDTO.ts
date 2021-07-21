import { IsNumber, IsString } from 'class-validator';

export class CreateSubGroupDTO {
  @IsNumber()
  seriesId: number;

  @IsString()
  name: string;

  @IsString()
  preferedResultion: '720' | '1080' | '480';
}
