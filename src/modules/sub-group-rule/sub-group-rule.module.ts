import { SubGroupRule } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';
import { SubGroupRuleService } from './sub-group-rule.service';
import { SubGroupRuleGateway } from './sub-group-rule.gateway';
import { SubgroupModule } from '../sub-group/sub-group.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroupRule]), forwardRef(() => SubgroupModule)],
  providers: [SubGroupRuleService, SubGroupRuleGateway],
  exports: [SubGroupRuleService],
})
export class SubgroupRuleModule {}
