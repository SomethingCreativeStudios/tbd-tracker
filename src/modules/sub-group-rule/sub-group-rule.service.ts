import { Injectable } from '@nestjs/common';
import { SubGroupRule } from './models';
import { SubGroupRuleRepository } from './sub-group-rule.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SubGroupRuleService {
  constructor(
    @InjectRepository(SubGroupRule)
    private readonly subgroupRuleRepository: SubGroupRuleRepository,
  ) {}
}
