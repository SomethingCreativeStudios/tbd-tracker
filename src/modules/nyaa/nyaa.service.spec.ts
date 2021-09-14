import { TestingModule, Test } from '@nestjs/testing';
import { existsSync, removeSync } from 'fs-extra';
import { NyaaService, NyaaFeed } from './nyaa.service';
import { SubGroup } from '../sub-group/models';
import { SubgroupModule } from '../sub-group';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestTypeOrmOptions } from '../../database/TestTypeOrmOptions';
import { ConfigModule } from '../../config';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { RuleType, SubGroupRule } from '../sub-group-rule/models';
import { NyaaItem } from './models/nyaaItem';
import { SocketModule } from '../socket/socket.module';
import { AppGateway } from '../../app/app.gateway';
import { Series } from '../series/models';

jest.setTimeout(700000);

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

  rules.forEach((rule) => {
    subGroup.addRule(createRule(rule.text, rule.type, rule.joinType));
  });

  return subGroup;
}

function createNyaaItem(subgroup, link, resolution = '720'): NyaaItem {
  return {
    resolution,
    downloadLink: 'test',
    publishedDate: new Date(),
    subGroupName: subgroup,
    itemName: link,
    episodeName: 0,
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
    { text: '', joinType: true, type: RuleType.BLANK },
  ]),
  createSubGroup('Doki', [
    { text: 'Idol Time PriPara', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Mobamas', joinType: true, type: RuleType.STARTS_WITH },
    { text: 'Angel Beats!', joinType: false, type: RuleType.STARTS_WITH },
    { text: 'B Gata H Kei', joinType: false, type: RuleType.STARTS_WITH },
    { text: '', joinType: true, type: RuleType.BLANK },
  ]),
  createSubGroup('Underwater', [
    { text: 'kill la kill', joinType: false, type: RuleType.STARTS_WITH },
    { text: '', joinType: true, type: RuleType.BLANK },
  ]),
];

describe('Items', () => {
  const service = new NyaaService(null, null, null, null, null);
  it('Replace Name - Nothing', () => {
    const series = new Series();

    const hundred = service.findFileNameBySeries(series.showName, series.offset, '[SubsPlease] 100-man no Inochi no Ue ni Ore wa Tatte Iru - 14 (720p) [6B61BF6E].mkv');
    const hero = service.findFileNameBySeries(series.showName, series.offset, '[Erai-raws] Boku no Hero Academia 5th Season - 16 [720p][Multiple Subtitle].mkv');

    expect(hundred).toBe('[SubsPlease] 100-man no Inochi no Ue ni Ore wa Tatte Iru - 14 (720p) [6B61BF6E].mkv');
    expect(hero).toBe('[Erai-raws] Boku no Hero Academia 5th Season - 16 [720p][Multiple Subtitle].mkv');
  });

  it('Replace Name - Offset', () => {
    const series = new Series();
    series.offset = 10;

    const hundred = service.findFileNameBySeries(series.showName, series.offset, '[SubsPlease] 100-man no Inochi no Ue ni Ore wa Tatte Iru - 14 (720p) [6B61BF6E].mkv');
    const hero = service.findFileNameBySeries(series.showName, series.offset, '[Erai-raws] Boku no Hero Academia 5th Season - 16 [720p][Multiple Subtitle].mkv');

    expect(hundred).toBe('[SubsPlease] 100-man no Inochi no Ue ni Ore wa Tatte Iru - 24 (720p) [6B61BF6E].mkv');
    expect(hero).toBe('[Erai-raws] Boku no Hero Academia 5th Season - 26 [720p][Multiple Subtitle].mkv');
  });

  it('Replace Name - Both', () => {
    const series = new Series();
    series.offset = 10;

    const hundred = service.findFileNameBySeries('Standing on hundred lives', 10, '[SubsPlease] 100-man no Inochi no Ue ni Ore wa Tatte Iru - 14 (720p) [6B61BF6E].mkv');
    const hero = service.findFileNameBySeries('Hero Academy', 10, '[Erai-raws] Boku no Hero Academia 5th Season - 16 [720p][Multiple Subtitle].mkv');

    expect(hundred).toBe('[SubsPlease] Standing on hundred lives - 24.mkv');
    expect(hero).toBe('[Erai-raws] Hero Academy - 26.mkv');
  });
});

describe('Formatter service', () => {
  let testingModule: TestingModule;
  let service: NyaaService;

  beforeAll(async (done) => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [
          SubgroupModule,
          SubgroupRuleModule,
          SocketModule,
          ConfigModule,
          TypeOrmModule.forRootAsync({
            useClass: TestTypeOrmOptions,
          }),
        ],
        providers: [NyaaService, AppGateway],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule?.get(NyaaService);
    done();
  });

  describe('Highway Service', () => {
    const rootPath = 'C:\\Users\\eric-\\Documents\\download_test';
    it('Test Download', async (done) => {
      const fileName = 'Maou Gakuin no Futekigousha [WN]';

      if (existsSync(`${rootPath}\\${fileName}`)) {
        removeSync(`${rootPath}\\${fileName}`);
      }

      expect(existsSync(`${rootPath}\\${fileName}`)).toBeFalsy();

      const result = await service.downloadShow('https://nyaa.si/download/1284616.torrent', rootPath, 'test');

      expect(result.error).toEqual(undefined);
      expect(existsSync(`${rootPath}\\${fileName}`)).toBeTruthy();

      removeSync(`${rootPath}\\${fileName}`);
      done();
    });
  });

  describe('Anime Feeds', () => {
    it('Getting All', async (done) => {
      const result = await service.fetchItems(NyaaFeed.ANIME);
      expect(result).not.toBeNull();
      done();
    });

    it('Link Filter', async (done) => {
      const goodCommie = service.findValidItems(
        [
          createNyaaItem('commie', 'go! princess precure - 100.mkv'),
          createNyaaItem('commie', 'go! princess precure - 89.mkv'),
          createNyaaItem('commie', 'Ghost in the Shell - 89.mkv'),
          createNyaaItem('commie', 'ghost in the shell - 89.mkv'),
        ],
        subgroups,
      );

      const goodDoki = service.findValidItems(
        [
          createNyaaItem('doki', 'Idol Time PriPara - 100.mkv'),
          createNyaaItem('dOki', 'Mobamas - 89.mkv'),
          createNyaaItem('doki', 'B Gata H Kei - 89.mkv'),
          createNyaaItem('doki', 'another show - 89.mkv'),
        ],
        subgroups,
      );

      expect(goodCommie.length).toEqual(2);
      expect(goodDoki.length).toEqual(3);

      done();
    });
  });
});
