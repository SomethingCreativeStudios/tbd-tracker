import { Injectable } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRepository } from './sub-group.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SubGroupService {
  constructor(
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: SubGroupRepository,
  ) {}

  public matchesSubgroup(text: string, subgroup: SubGroup) {
    return false;
  }
}
