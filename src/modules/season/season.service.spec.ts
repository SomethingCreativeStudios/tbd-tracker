import { TestingModule, Test } from '@nestjs/testing';
import { SeasonModule } from './season.module';
import { SeriesModule } from '../series/series.module';
import { TestModule } from '../test/test.module';
import { SeasonService } from './season.service';
import { SeasonName } from './models';

describe('Season Service', () => {
  let testingModule: TestingModule;
  let service: SeasonService;

  beforeAll(async done => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [SeriesModule, SeasonModule, TestModule],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule?.get(SeasonService);
    done();
  });

  describe('Season', () => {
    it('Auto Generate', async done => {
      const newSeason = await service.generateFromSeason(SeasonName.FALL, 2020);
      expect(newSeason.series.length).toBeGreaterThan(0);
      done();
    });
  });
});
