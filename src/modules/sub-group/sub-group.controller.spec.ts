import { Test } from '@nestjs/testing';
import { SubgroupModule } from '.';
import { TestModule } from '../test/test.module';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { SubgroupController } from './sub-group.controller';
import { SubGroupService } from './sub-group.service';
import { SubGroup } from './models';
import { RuleType, SubGroupRule } from '../sub-group-rule/models';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';

function createRule(ruleText: string, type: RuleType, joinType: boolean) {
  const rule = new SubGroupRule();
  rule.text = ruleText;
  rule.ruleType = type;
  rule.isPositive = joinType;
  return rule;
}

function createSubGroup(name: string, rules: { text: string; type: RuleType; joinType: boolean }[]) {
  const subGroup = new SubGroup();
  subGroup.name = name;
  subGroup.preferedResultion = '720';

  rules.forEach(rule => {
    subGroup.addRule(createRule(rule.text, rule.type, rule.joinType));
  });

  return subGroup;
}

describe('Subgroup Controller', () => {
  let subgroupController: SubgroupController;
  let subgroupService: SubGroupService;
  let subgroupRuleService: SubGroupRuleService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SubgroupModule, SubgroupRuleModule, TestModule],
    }).compile();

    subgroupController = moduleRef.get<SubgroupController>(SubgroupController);
    subgroupService = moduleRef.get<SubGroupService>(SubGroupService);
    subgroupRuleService = moduleRef.get<SubGroupRuleService>(SubGroupRuleService);
  });

  it(`findAll subgroup`, async () => {
    expect((await subgroupController.findAll()).length).toBeGreaterThan(0);
  });

  it(`create subgroup`, async () => {
    const created = await subgroupController.create(createSubGroup('TEST', [{ text: 'Spice', joinType: true, type: RuleType.CONTAINS }]));

    const found = (await subgroupService.find({ id: created.id }))[0];

    expect(found.name).toEqual('TEST');
  });

  it(`update subgroup`, async () => {
    const found = await subgroupService.create(createSubGroup('TEST', [{ text: 'Spice', joinType: true, type: RuleType.CONTAINS }]));

    const updated = await subgroupController.update({ ...found, name: 'Updated', rules: [{ ...found.rules[0], text: 'New Spice' }] } as SubGroup);

    const foundAfter = (await subgroupService.find({ id: found.id }))[0];

    expect(updated.name).toEqual('Updated');
    expect(foundAfter.name).toEqual('Updated');
    expect(foundAfter.rules[0].text).toEqual('New Spice');
  });

  it(`remove subgroup`, async () => {
    const found = await subgroupService.create(createSubGroup('TEST', [{ text: 'Spice', joinType: true, type: RuleType.CONTAINS }]));

    await subgroupController.delete(found.id);

    const foundAfter = await subgroupService.find({ id: found.id });

    expect(foundAfter.length).toEqual(0);
  });

  it(`add rule`, async () => {
    const found = await subgroupService.create(createSubGroup('TEST', []));

    const test = await subgroupController.addRule(found.id, createRule('Spice', RuleType.ENDS_WITH, true));

    const foundAfter = (await subgroupService.find({ id: found.id }))[0];

    expect(found.rules).not.toBeDefined();
    expect(foundAfter.rules.length).toEqual(1);
    expect(foundAfter.rules[0].text).toEqual('Spice');
  });

  it(`remove rule`, async () => {
    const found = await subgroupService.create(createSubGroup('TEST', [{ text: 'Spice', joinType: true, type: RuleType.CONTAINS }]));

    await subgroupController.removeRule(found.rules[0].id);

    const foundAfter = await subgroupRuleService.find({ id: found.id });

    expect(foundAfter.length).toBeLessThanOrEqual(0);
  });

  it(`update rule`, async () => {
    const subgroup = await subgroupService.create(createSubGroup('TEST', [{ text: 'Spice', joinType: true, type: RuleType.CONTAINS }]));

    const updated = await subgroupController.updateRule(subgroup.rules[0].id, { text: 'New Spice' });

    const foundAfter = (await subgroupRuleService.find({ id: subgroup.rules[0].id }))[0];

    expect(foundAfter.text).toEqual('New Spice');
  });
});
