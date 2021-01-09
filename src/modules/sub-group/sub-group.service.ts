import { Injectable } from '@nestjs/common';
import { SubGroup } from './models';
import { SubGroupRepository } from './sub-group.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';
import { DeepPartial } from 'typeorm';
import { uniq } from 'ramda';

@Injectable()
export class SubGroupService {
  constructor(
    @InjectRepository(SubGroup)
    private readonly subgroupRepository: SubGroupRepository,
    private readonly subgroupRuleService: SubGroupRuleService,
  ) {}

  public async create(subGroup: SubGroup) {
    return this.subgroupRepository.save(subGroup);
  }

  public async createAll(subGroups: SubGroup[]) {
    const prom = subGroups.map(group => this.subgroupRepository.save(group));
    return Promise.all(prom);
  }

  public async update(subGroup: SubGroup) {
    return this.subgroupRepository.save(subGroup);
  }

  public async delete(subGroup: SubGroup) {
    const rules = (subGroup.rules || []).map(rule => this.subgroupRuleService.delete(rule));

    await Promise.all(rules);

    return this.subgroupRepository.remove(subGroup);
  }

  public async find(subGroup: DeepPartial<SubGroup>) {
    return this.subgroupRepository.find({
      relations: ['rules', 'series'],
      where: [{ id: subGroup.id }, { name: subGroup.name }, { preferedResultion: subGroup.preferedResultion }],
    });
  }

  public async findOne(subGroup: DeepPartial<SubGroup>) {
    return (await this.find(subGroup))[0];
  }

  public async findAll() {
    return this.subgroupRepository.find({ relations: ['rules'] });
  }

  public async findNames() {
    try {
      const results = await this.subgroupRepository
        .createQueryBuilder()
        .select('name')
        .getRawMany();

      return uniq((results || []).map(({ name }) => name));
    } catch {
      return [];
    }
  }

  public matchesSubgroup(text: string, subgroup: SubGroup) {
    if (subgroup.rules.length === 0) {
      return true;
    }

    const goodRules = subgroup.rules.filter(rule => rule.isPositive);
    const badRules = subgroup.rules.filter(rule => !rule.isPositive);

    const passesGood = goodRules.every(rule => this.subgroupRuleService.matchRule(text, rule, subgroup));
    const passesBad = badRules.every(rule => this.subgroupRuleService.matchRule(text, rule, subgroup));

    return passesGood && (badRules.length > 0 ? !passesBad : true);
  }
}
