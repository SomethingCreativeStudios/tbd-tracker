import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../config';
import { TestTypeOrmOptions } from '../../database/TestTypeOrmOptions';
import { RuleType } from '../sub-group-rule/models';
import { AnimeFolderService } from './anime-folder.service';
import { AnimeFolderRule } from './models';

const makeFolderRule = (folderName: string, text: string, ruleType = RuleType.CONTAINS) => {
  const rule = new AnimeFolderRule();

  rule.folderName = folderName;
  rule.ruleType = ruleType;
  rule.textMatch = text;

  return rule;
};

const folderNames = ['Spice and Wolf', 'Spice and Salt', 'Katanagatari', 'Bleach', 'So, what Iam Spider', 'Watashi Wa Cruise Control'];

const folderRules = [
  makeFolderRule('Watashi Wa Cruise Control', 'I am Cruise Control'),
  makeFolderRule('Watashi Wa Cruise Control', 'Unrelated Name'),
];

describe('Anime Folder Service', () => {
  let testingModule: TestingModule;
  let service: AnimeFolderService;

  beforeAll(async done => {
    try {
      testingModule = await Test.createTestingModule({
        imports: [
          ConfigModule,
          TypeOrmModule.forRootAsync({
            useClass: TestTypeOrmOptions,
          }),
        ],
        providers: [AnimeFolderService],
      }).compile();
    } catch (ex) {
      console.error(ex);
    }

    service = testingModule?.get(AnimeFolderService);
    done();
  });
  describe('Folders', () => {
    it('Best Match', () => {
      console.log(service.getFolders());
    });
  });
  describe('Anime Feeds', () => {
    it('Best Match', () => {
      expect(service.matchFolder('[WolfSubs] Spice and Wolf - 10.mkv', folderNames, folderRules)).toEqual('Spice and Wolf');
      expect(service.matchFolder('[WolfSubs] Spice and Salt - 10.mkv', folderNames, folderRules)).toEqual('Spice and Salt');

      expect(service.matchFolder('[WolfSubs] Salt and Wolf - 2222.mkv', folderNames, folderRules)).toEqual('Spice and Wolf');
      expect(service.matchFolder('[WolfSubs] Fox and Salt - 2222.mkv', folderNames, folderRules)).toEqual('Spice and Salt');
    });

    it('Best Rule', () => {
      expect(service.matchFolder('[CarSubs] I am Cruise Control - 10.mkv', folderNames, folderRules)).toEqual('Watashi Wa Cruise Control');
      expect(service.matchFolder('[CarSubs] Unrelated name - 10.mkv', folderNames, folderRules)).toEqual('Watashi Wa Cruise Control');
      expect(service.matchFolder('[CarSubs] Watashi Wa Cruise Control - 10.mkv', folderNames, folderRules)).toEqual('Watashi Wa Cruise Control');
    });

    it('Unrelated', () => {
      expect(service.matchFolder('[CarSubs] Naruto - 10.mkv', folderNames, folderRules)).toEqual('');
      expect(service.matchFolder('[CarSubs] Blahahahahah - 10.mkv', folderNames, folderRules)).toEqual('');
      expect(service.matchFolder('[CarSubs] bakemonogatari - 10.mkv', folderNames, folderRules)).toEqual('');
    });
  });
});
