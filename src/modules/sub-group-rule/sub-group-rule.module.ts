import { SubGroupRule } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';
import { SubGroupRuleService } from './sub-group-rule.service';
import { SubgroupRuleController } from './sub-group-rule.controller';
import { SubGroupRuleGateway } from './sub-group-rule.gateway';
import { SubgroupModule } from '../sub-group/sub-group.module';
import { SeriesModule } from '../series/series.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroupRule]), forwardRef(() => SubgroupModule), forwardRef(() => SeriesModule)],
  providers: [SubGroupRuleService, SubGroupRuleGateway],
  controllers: [SubgroupRuleController],
  exports: [SubGroupRuleService],
})
export class SubgroupRuleModule {}
