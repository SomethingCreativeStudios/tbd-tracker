import { TestingModule, Test } from '@nestjs/testing';
import { SubGroupService, SubgroupModule } from '.';
import { TestModule } from '../test/test.module';
import { SubGroup } from './models';
import { SubGroupRule, RuleType } from '../sub-group-rule/models';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { SubGroupRuleService } from '../sub-group-rule/sub-group-rule.service';

jest.setTimeout(3000);

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

describe('Sub group service', () => {
  let testingModule: TestingModule;
  let service: SubGroupService;
  let ruleService: SubGroupRuleService;

  beforeAll(async done => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [SubgroupModule, SubgroupRuleModule, TestModule],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule.get(SubGroupService);
    ruleService = testingModule.get(SubGroupRuleService);

    done();
  });

  describe('CRUD', () => {
    it('Create', async () => {
      const subGroup = createSubGroup('test', [{ text: 'Spice', type: RuleType.CONTAINS, joinType: true }]);
      const newGroup = await service.create(subGroup);

      expect(newGroup.id).not.toBeNull();
      expect(newGroup.rules.length).toBeGreaterThan(0);
      expect(newGroup.rules[0].id).not.toBeNull();

      expect(await ruleService.find({ id: newGroup.rules[0].id })).not.toEqual([]);
    });

    it('Read', async () => {
      const subGroup = createSubGroup('test', [{ text: 'Spice', type: RuleType.CONTAINS, joinType: true }]);
      const newGroup = await service.create(subGroup);

      expect(newGroup.id).not.toBeNull();
      expect(newGroup.rules.length).toBeGreaterThan(0);
      expect(newGroup.rules[0].id).not.toBeNull();

      const foundGroup = await service.find({ id: newGroup.id });

      expect(foundGroup.length).toEqual(1);
      expect(foundGroup[0].id).toEqual(newGroup.id);
    });

    it('Update', async done => {
      const subGroup = createSubGroup('test', [{ text: 'Spice', type: RuleType.CONTAINS, joinType: true }]);
      const newGroup = await service.create(subGroup);

      expect(newGroup.name).toEqual('test');
      expect(newGroup.rules[0].text).toEqual('Spice');

      newGroup.name = 'New test';
      newGroup.rules[0].text = 'New Spice';

      const updatedGroup = await service.update(newGroup);

      expect(updatedGroup.name).toEqual('New test');
      expect(updatedGroup.rules[0].text).toEqual('New Spice');

      const foundGroup = await service.find({ id: newGroup.id });

      expect(foundGroup[0].name).toEqual('New test');
      expect(foundGroup[0].rules[0].text).toEqual('New Spice');

      done();
    });

    it('Delete', async () => {
      const subGroup = createSubGroup('test', [{ text: 'Spice', type: RuleType.CONTAINS, joinType: true }]);
      const newGroup = await service.create(subGroup);

      expect(newGroup.id).not.toBeNull();
      expect(newGroup.rules.length).toBeGreaterThan(0);
      expect(newGroup.rules[0].id).not.toBeNull();

      await service.delete(newGroup);

      expect(await service.find({ id: newGroup.id })).toEqual([]);
      expect(await ruleService.find({ id: newGroup.rules[0].id })).toEqual([]);
    });
  });

  describe('Filter', () => {
    it('Contains', async () => {
      const subGroup = createSubGroup('test', [{ text: 'Spice', type: RuleType.CONTAINS, joinType: true }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'idol', type: RuleType.CONTAINS, joinType: true },
        { text: 'sport', type: RuleType.CONTAINS, joinType: true },
      ]);

      const notGroup = createSubGroup('test', [{ text: 'idol', type: RuleType.CONTAINS, joinType: false }]);
      const notManyGroups = createSubGroup('test', [
        { text: 'idol', type: RuleType.CONTAINS, joinType: false },
        { text: 'wolf', type: RuleType.CONTAINS, joinType: true },
      ]);

      expect(service.matchesSubgroup('spice and wolf', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('fox and salt', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('IdOls and spice', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('Sports and wolves', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('Id0ls', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('Sports and Idols', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('Idols', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('Id0ls', notGroup)).toBeTruthy();
      expect(service.matchesSubgroup('Sports and Idols', notGroup)).toBeFalsy();

      expect(service.matchesSubgroup('Id0ls', notManyGroups)).toBeFalsy();
      expect(service.matchesSubgroup('Wolf and Idols', notManyGroups)).toBeFalsy();
      expect(service.matchesSubgroup('Wolf and spice', notManyGroups)).toBeTruthy();
    });

    it('Ends With', async () => {
      const subGroup = createSubGroup('test', [{ text: 'wolf', type: RuleType.ENDS_WITH, joinType: true }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'fox', type: RuleType.ENDS_WITH, joinType: true },
        { text: 'salt', type: RuleType.ENDS_WITH, joinType: true },
      ]);

      expect(service.matchesSubgroup('spice and wolf', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('wolf and salt', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('fox and fox', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('fox and salt', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('fox and things', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('fox salt', manyRulesGroup)).toBeTruthy();
    });

    it('Starts With', async () => {
      const subGroup = createSubGroup('test', [{ text: 'wolf', type: RuleType.STARTS_WITH, joinType: true }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'fox', type: RuleType.STARTS_WITH, joinType: true },
        { text: 'salt', type: RuleType.STARTS_WITH, joinType: true },
      ]);

      expect(service.matchesSubgroup('wolf and spice', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('spice and wolf', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('fox and fox', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('salt and fox', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('f0x and things', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('fox salt', manyRulesGroup)).toBeTruthy();
    });

    it('Regex', async () => {
      const subGroup = createSubGroup('test', [{ text: 'sword\\d', type: RuleType.REGEX, joinType: true }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'sword\\d', type: RuleType.REGEX, joinType: true },
        { text: 'other\\d', type: RuleType.REGEX, joinType: true },
      ]);

      expect(service.matchesSubgroup('sword2', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('sworded', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('sword2', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('other1 sword2', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('sw0rd2', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('sword2222210', manyRulesGroup)).toBeTruthy();
    });
  });
});
