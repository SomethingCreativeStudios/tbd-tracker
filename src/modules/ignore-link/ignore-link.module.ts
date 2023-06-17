import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IgnoreLink } from './models/ignore-link.entity';
import { IgnoreLinkService } from './ignore-link.service';

@Module({
  imports: [TypeOrmModule.forFeature([IgnoreLink])],
  providers: [IgnoreLinkService],
  exports: [IgnoreLinkService],
})
export class IgnoreLinkModule {}
