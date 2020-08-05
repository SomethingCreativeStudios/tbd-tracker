import { TestingModule, Test } from '@nestjs/testing';
import { SubGroupService, SubgroupModule } from '.';
import { TestModule } from '../test/test.module';
import { SubGroup } from './models';
import { SubGroupRule, RuleType } from '../sub-group-rule/models';

jest.setTimeout(7000);

function createRule(ruleText: string, type: RuleType) {
  const rule = new SubGroupRule();
  rule.text = ruleText;
  rule.ruleType = type;
  return rule;
}

describe('Sub group service', () => {
  let testingModule: TestingModule;
  let service: SubGroupService;

  beforeAll(async () => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [SubgroupModule, SubGroupRule, TestModule],
        providers: [SubGroupService],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule.get(SubGroupService);
  });

  describe('Filter', () => {
    it('Inludes', async () => {
      const subGroup = new SubGroup();
      subGroup.name = 'RandomSubGroup';
      subGroup.addRule(createRule('Spice', RuleType.STARTS_WITH));
      subGroup.addRule(createRule('Spice', RuleType.STARTS_WITH));
    });
  });
});
