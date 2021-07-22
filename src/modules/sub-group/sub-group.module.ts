import { SubGroupService } from './sub-group.service';
import { SubGroup } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { SubGroupGateway } from './sub-group.gateway';
import { SeriesModule } from '../series/series.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroup]), SubgroupRuleModule, forwardRef(() => SeriesModule)],
  providers: [SubGroupService, SubGroupGateway],
  exports: [SubGroupService],
})
export class SubgroupModule {}
