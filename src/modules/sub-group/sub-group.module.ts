import { SubGroupService } from './sub-group.service';
import { SubgroupController } from './sub-group.controller';
import { SubGroup } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { SubGroupGateway } from './sub-group.gateway';
import { SeriesModule } from '../series/series.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroup]), SubgroupRuleModule, forwardRef(() => SeriesModule)],
  providers: [SubGroupService, SubGroupGateway],
  controllers: [SubgroupController],
  exports: [SubGroupService],
})
export class SubgroupModule {}
