import { IsString } from 'class-validator';

export class CreateSubGroupDTO {
  @IsString()
  name: string;

  @IsString()
  preferedResultion: '720' | '1080' | '480';
}
