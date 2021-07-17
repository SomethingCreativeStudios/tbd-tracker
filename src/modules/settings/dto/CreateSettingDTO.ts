import { IsEnum, IsString } from 'class-validator';
import { SettingType } from '../models/setting.entity';

export class CreateSettingDTO {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsEnum(SettingType)
  type: SettingType;
}
