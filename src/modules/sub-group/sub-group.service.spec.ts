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
  });
});
