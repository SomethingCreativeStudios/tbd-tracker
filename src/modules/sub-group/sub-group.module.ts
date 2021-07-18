import { SubGroupService } from './sub-group.service';
import { SubGroup } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { SubGroupGateway } from './sub-group.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroup]), SubgroupRuleModule],
  providers: [SubGroupService, SubGroupGateway],
  exports: [SubGroupService],
})
export class SubgroupModule {}
