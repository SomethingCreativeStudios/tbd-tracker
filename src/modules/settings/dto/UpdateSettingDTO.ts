import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SettingType } from '../models/setting.entity';

export class UpdateSettingDTO {
  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsEnum(SettingType)
  @IsOptional()
  type?: SettingType;
}
