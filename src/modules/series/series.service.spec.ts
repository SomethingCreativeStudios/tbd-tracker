import { TestingModule, Test } from '@nestjs/testing';
import { SeasonModule } from '../season/season.module';
import { SeriesModule } from './series.module';
import { SeriesService } from './series.service';
import { TestModule } from '../test/test.module';
import { SubgroupModule, SubGroupService } from '../sub-group';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';
import { SubGroup } from '../sub-group/models';
import { SubGroupRule, RuleType } from '../sub-group-rule/models';

describe('Formatter service', () => {
  let testingModule: TestingModule;
  let service: SeriesService;
  let subgroupService: SubGroupService;

  beforeAll(async done => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [SeriesModule, SubgroupModule, SubgroupRuleModule, SeasonModule, TestModule],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule?.get(SeriesService);
    subgroupService = testingModule?.get(SubGroupService);
    done();
  });

  describe('Series', () => {

    it('Auto Generate', async done => {
      const show = await service.createFromMALName('Spice and Wolf');
      expect(show.name.toLowerCase()).toContain('ookami to koushinryou');
      done();
    });

    it('Search For', async done => {
      const shows = await service.findFromMAL('Spice and Wolf');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows[0].name.toLowerCase()).toContain('ookami to koushinryou');
      done();
    });

    it('Adding Subgroup', async done => {
      const subgroup = new SubGroup();
      subgroup.name = 'TEST';
      subgroup.preferedResultion = '1080';

      const foundSeries = await service.findFromMAL('Spice and Wolf');

      expect(foundSeries[0].id).toBeUndefined();

      const show = await service.create(foundSeries[0]);

      expect(show.id).not.toBeUndefined();

      show.subgroups = [subgroup];

      const updatedShow = await service.update(show);

      expect(updatedShow.subgroups[0]).not.toBeUndefined();
      expect(updatedShow.subgroups[0].id).not.toBeUndefined();

      done();
    });

    it('Adding Subgroup - With Rule', async done => {
      const subgroup = new SubGroup();
      subgroup.name = 'TEST';
      subgroup.preferedResultion = '1080';

      const foundSeries = await service.findFromMAL('Spice and Wolf');

      expect(foundSeries[0].id).toBeUndefined();

      const show = await service.create(foundSeries[0]);

      expect(show.id).not.toBeUndefined();

      show.subgroups = [subgroup];

      const updatedShow = await service.update(show);

      expect(updatedShow.subgroups[0]).not.toBeUndefined();
      expect(updatedShow.subgroups[0].id).not.toBeUndefined();

      const rule = new SubGroupRule();
      rule.text = 'TESTeeeee';
      rule.ruleType = RuleType.CONTAINS;
      rule.isPositive = true;

      updatedShow.subgroups[0].addRule(rule);

      const updatedShow2 = await service.update(updatedShow);

      expect(updatedShow2.subgroups[0].rules).not.toBeUndefined();
      expect(updatedShow2.subgroups[0].rules[0]).not.toBeUndefined();

      done();
    });

    it('Adding Subgroup - With Rule via group', async done => {
      const subgroup = new SubGroup();
      subgroup.name = 'TEST';
      subgroup.preferedResultion = '1080';

      const foundSeries = await service.findFromMAL('Spice and Wolf');

      expect(foundSeries[0].id).toBeUndefined();

      const show = await service.create(foundSeries[0]);

      expect(show.id).not.toBeUndefined();

      show.subgroups = [subgroup];

      const updatedShow = await service.update(show);

      expect(updatedShow.subgroups[0]).not.toBeUndefined();
      expect(updatedShow.subgroups[0].id).not.toBeUndefined();

      const rule = new SubGroupRule();
      rule.text = 'TESTeeeee';
      rule.ruleType = RuleType.CONTAINS;
      rule.isPositive = true;

      const group = (await subgroupService.find({ id: updatedShow.subgroups[0].id }))[0];

      group.rules = [rule];

      const updatedGroup = await subgroupService.update(group);

      expect(updatedGroup.rules[0].id).not.toBeUndefined();

      const foundSeries2 = await service.findById(show.id);

      expect(foundSeries2.subgroups[0].rules[0]).not.toBeUndefined();
      expect(foundSeries2.subgroups[0].rules[0].id).not.toBeUndefined();

      done();
    });
  });
});
