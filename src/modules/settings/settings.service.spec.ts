import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { assert } from 'joi';
import { Repository } from 'typeorm';
import { Settings, SettingType } from './models/setting.entity';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    let initialDB = [
      { id: 0, key: 'test-key', value: 'test-value', type: SettingType.STRING },
      { id: 1, key: 'test-key-2', value: 'test-value-2', type: SettingType.STRING },
      { id: 2, key: 'test-key-3', value: 'test-value-3', type: SettingType.STRING },
    ] as Settings[];

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Settings),
          useValue: {
            delete: async (id) => {
              const current = initialDB.length;
              initialDB = initialDB.filter((setting) => setting.id !== id);
              return { affected: current - initialDB.length };
            },
            find: async (value) => {
              if (value?.where?.key) {
                return initialDB.filter((setting) => setting.key === value?.where?.key);
              }

              if (value?.where?.type) {
                return initialDB.filter((setting) => setting.type === value?.where?.type);
              }

              if (value?.where?.value) {
                return initialDB.filter((setting) => setting.value === value?.where?.value);
              }

              return initialDB;
            },
            save: async (value) => ({ id: 1, ...value }),
          } as Partial<Repository<Settings>>,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('Setting', () => {
    it('create', async () => {
      const newSetting = await service.create({ key: 'new-key', type: SettingType.STRING, value: 'new-value' });

      expect(newSetting.id).toBeDefined();
    });

    it('find', async () => {
      const foundAllSettings = await service.find();
      const foundKey = await service.find({ key: 'test-key' });
      const didNotFindKey = await service.find({ key: 'test-value' });

      expect(foundAllSettings.length).toEqual(3);
      expect(foundKey.length).toEqual(1);
      expect(didNotFindKey.length).toEqual(0);
    });

    it('delete', async () => {
      await service.remove(0);
      const foundKey = await service.find({ key: 'test-key' });

      expect(foundKey.length).toEqual(0);
    });
  });
});
