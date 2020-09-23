import { SubGroupService } from './sub-group.service';
import { SubgroupController } from './sub-group.controller';
import { SubGroup } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroup]), SubgroupRuleModule],
  providers: [SubGroupService],
  controllers: [SubgroupController],
  exports: [SubGroupService],
})
export class SubgroupModule {}
