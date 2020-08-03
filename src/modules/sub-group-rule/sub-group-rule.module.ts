import { SubGroupRule } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SubGroupRuleService } from './sub-group-rule.service';
import { SubgroupRuleController } from './sub-group-rule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroupRule])],
  providers: [SubGroupRuleService],
  controllers: [SubgroupRuleController],
  exports: [SubGroupRuleService],
})
export class SubgroupRuleModule {}
