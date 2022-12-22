import { IsNumber, IsString } from 'class-validator';

export class DownloadDTO {
  @IsString()
  url: string;

  @IsNumber()
  seriesId: number;

  @IsString()
  name: string;
}
