import { TestingModule, Test } from '@nestjs/testing';
import { SubGroupService, SubgroupModule } from '.';
import { TestModule } from '../test/test.module';
import { SubGroup } from './models';
import { SubGroupRule } from '../sub-group-rule/models';

jest.setTimeout(7000);

describe('Sub group service', () => {
  let testingModule: TestingModule;
  let service: SubGroupService;

  beforeAll(async () => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [SubgroupModule, TestModule],
        providers: [SubGroupService],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule.get(SubGroupService);
  });

  describe('Filter', () => {
    it('Contain', async () => {});
  });
});
