import { TestingModule, Test } from '@nestjs/testing';
import { NyaaService, NyaaFeed } from './nyaa.service';
import { SubGroup } from '../sub-group/models';
import { SubGroupService, SubgroupModule } from '../sub-group';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestTypeOrmOptions } from '../../database/TestTypeOrmOptions';
import { ConfigModule } from '../../config';
import { INestApplication } from '@nestjs/common';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { RuleType, SubGroupRule } from '../sub-group-rule/models';
import { NyaaItem } from './models/nyaaItem';

jest.setTimeout(7000);

function createRule(ruleText: string, type: RuleType, joinType: boolean) {
  const rule = new SubGroupRule();
  rule.text = ruleText;
  rule.ruleType = type;
  rule.ruleJoin = joinType;
  return rule;
}

function createSubGroup(name: string, rules: { text: string; type: RuleType; joinType: boolean }[], allPass: boolean = true) {
  const subGroup = new SubGroup();
  subGroup.name = name;
  subGroup.allPass = allPass;

  rules.forEach(rule => {
    subGroup.addRule(createRule(rule.text, rule.type, rule.joinType));
  });

  return subGroup;
}

function createNyaaItem(subgroup, link): NyaaItem {
  return {
    downloadLink: 'test',
    publishedDate: new Date(),
    subGroupName: subgroup,
    itemName: link,
  };
}

const newItems = [
  createNyaaItem('commie', 'go! princess precure - 100.mkv'),
  createNyaaItem('commie', 'lupin the thrid - 20.mkv'),
  createNyaaItem('commie', 'something that should go thru - 20.mkv'),
  createNyaaItem('commie', 'Attack on titan - 20.mkv'),
  createNyaaItem('commie', 'Attack on eoten- 20.mkv'),
  createNyaaItem('commie', 'Ghost in the shell- 20.mkv'),
  createNyaaItem('doki', 'Idol Time PriParal- 20.mkv'),
  createNyaaItem('doki', 'Mobamas- 20.mkvl'),
  createNyaaItem('doki', 'Angel Beats! - 20.mkv'),
  createNyaaItem('Underwater', 'kill la kill - 20.mkv'),
] as NyaaItem[];

const subgroups = [
  createSubGroup('commie', [
    { text: 'Go! Princess Precure', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Lupin the Third', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Attack on Titan', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Attack on Eoten', joinType: false, type: RuleType.STARTS_WITH },
    { text: 'Ghost in the Shell', joinType: false, type: RuleType.STARTS_WITH },
  ]),
  createSubGroup('Doki', [
    { text: 'Idol Time PriPara', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Mobamas', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Angel Beats!', joinType: false, type: RuleType.STARTS_WITH },
    { text: 'B Gata H Kei', joinType: false, type: RuleType.STARTS_WITH },
  ]),
  createSubGroup('Underwater', [{ text: 'kill la kill', joinType: false, type: RuleType.STARTS_WITH }]),
];

describe('Formatter service', () => {
  let testingModule: TestingModule;
  let service: NyaaService;

  beforeAll(async done => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [
          SubgroupModule,
          SubgroupRuleModule,
          ConfigModule,
          TypeOrmModule.forRootAsync({
            useClass: TestTypeOrmOptions,
          }),
        ],
        providers: [NyaaService],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule?.get(NyaaService);
    done();
  });

  describe('Anime Feeds', () => {
    it('Getting All', async done => {
      const result = await service.fetchItems(NyaaFeed.ANIME);
      expect(result).not.toBeNull();
      done();
    });

    it('Passes good', async done => {
      const result = service.findValidItems([createNyaaItem('commie', 'go! princess precure - 100.mkv')], subgroups);
      expect(result.length).toBeGreaterThan(0);
      done();
    });
  });
});
