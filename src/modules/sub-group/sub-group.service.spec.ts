import { TestingModule, Test } from '@nestjs/testing';
import { SubGroupService, SubgroupModule } from '.';
import { TestModule } from '../test/test.module';
import { SubGroup } from './models';
import { SubGroupRule, RuleType } from '../sub-group-rule/models';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';

// jest.setTimeout(7000);

function createRule(ruleText: string, type: RuleType) {
  const rule = new SubGroupRule();
  rule.text = ruleText;
  rule.ruleType = type;
  return rule;
}

function createSubGroup(name: string, rules: { text: string; type: RuleType }[]) {
  const subGroup = new SubGroup();
  subGroup.name = name;

  rules.forEach(rule => {
    subGroup.addRule(createRule(rule.text, rule.type));
  });

  return subGroup;
}

describe('Sub group service', () => {
  let testingModule: TestingModule;
  let service: SubGroupService;

  beforeAll(async () => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [SubgroupModule, SubgroupRuleModule, TestModule],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule.get(SubGroupService);
  });

  describe('Filter', () => {
    it('Contains', async () => {
      const subGroup = createSubGroup('test', [{ text: 'Spice', type: RuleType.CONTAINS }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'idol', type: RuleType.CONTAINS },
        { text: 'sport', type: RuleType.CONTAINS },
      ]);

      expect(service.matchesSubgroup('spice and wolf', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('fox and salt', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('IdOls and spice', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('Sports and wolves', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('Id0ls', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('Sports and Idols', manyRulesGroup)).toBeTruthy();
    });

    it('Ends With', async () => {
      const subGroup = createSubGroup('test', [{ text: 'wolf', type: RuleType.ENDS_WITH }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'fox', type: RuleType.ENDS_WITH },
        { text: 'salt', type: RuleType.ENDS_WITH },
      ]);

      expect(service.matchesSubgroup('spice and wolf', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('wolf and salt', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('fox and fox', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('fox and salt', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('fox and things', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('fox salt', manyRulesGroup)).toBeTruthy();
    });

    it('Starts With', async () => {
      const subGroup = createSubGroup('test', [{ text: 'wolf', type: RuleType.STARTS_WITH }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'fox', type: RuleType.STARTS_WITH },
        { text: 'salt', type: RuleType.STARTS_WITH },
      ]);

      expect(service.matchesSubgroup('wolf and spice', subGroup)).toBeTruthy();
      expect(service.matchesSubgroup('spice and wolf', subGroup)).toBeFalsy();

      expect(service.matchesSubgroup('fox and fox', manyRulesGroup)).toBeTruthy();
      expect(service.matchesSubgroup('salt and fox', manyRulesGroup)).toBeTruthy();

      expect(service.matchesSubgroup('f0x and things', manyRulesGroup)).toBeFalsy();
      expect(service.matchesSubgroup('fox salt', manyRulesGroup)).toBeTruthy();
    });

    it('Regex', async () => {
      const subGroup = createSubGroup('test', [{ text: 'sword\\d', type: RuleType.REGEX }]);
      const manyRulesGroup = createSubGroup('test', [
        { text: 'sword\\d', type: RuleType.REGEX },
        { text: 'other\\d', type: RuleType.REGEX },
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
