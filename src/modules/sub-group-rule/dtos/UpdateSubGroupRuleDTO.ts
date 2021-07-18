import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RuleType } from '../models';

export class UpdateSubGroupRuleDTO {
  @IsNumber()
  id: number;

  @IsString()
  @IsOptional()
  text?: string;

  @IsEnum(RuleType)
  @IsOptional()
  ruleType?: RuleType;

  @IsBoolean()
  @IsOptional()
  isPositive?: boolean;
}
