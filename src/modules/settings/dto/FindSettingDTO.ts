import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SettingType } from '../models/setting.entity';

export class FindSettingDTO {
  @IsString()
  @IsOptional()
  key?: string;

  @IsEnum(SettingType)
  @IsOptional()
  type?: string;
}
