import { Test, TestingModule } from '@nestjs/testing';
import { TvShowService } from './tv-show.service';
import { TvShowModule } from './tv-shows.module';
import { TestModule } from '../test/test.module';

describe('TvShow Service', () => {
  let testingModule: TestingModule;
  let service: TvShowService;

  beforeAll(async () => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [TvShowModule, TestModule],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule?.get(TvShowService);
  });

  describe('Series', () => {
    it('Search For', async () => {
      const result = await service.doTheThing();
    });
  });
});
