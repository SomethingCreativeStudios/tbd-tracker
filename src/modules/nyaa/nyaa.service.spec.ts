import { TestingModule, Test } from '@nestjs/testing';
import { NyaaService, NyaaFeed } from './nyaa.service';
import { SubGroup } from '../sub-group/models';
import { SubGroupService, SubgroupModule } from '../sub-group';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestTypeOrmOptions } from '../../database/TestTypeOrmOptions';
import { ConfigModule } from '../../config';
import { INestApplication } from '@nestjs/common';
import { SubgroupRuleModule } from '../sub-group-rule/sub-group-rule.module';

jest.setTimeout(7000);

describe('Formatter service', () => {
  let testingModule: TestingModule;
  let service: NyaaService;

  beforeAll(async () => {
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
  });

  describe('Anime Feeds', () => {
    it('Getting All', async () => {
      const result = await service.fetchItems(NyaaFeed.ANIME);
      expect(result).toBeNull();
    });
  });
});
