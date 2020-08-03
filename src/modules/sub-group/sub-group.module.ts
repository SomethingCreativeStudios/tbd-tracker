import { SubGroupService } from './sub-group.service';
import { SubgroupController } from './sub-group.controller';
import { SubGroup } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([SubGroup])],
  providers: [SubGroupService],
  controllers: [SubgroupController],
  exports: [SubGroupService],
})
export class SubgroupModule {}
