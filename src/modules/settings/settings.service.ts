import { Injectable } from '@nestjs/common';
import { Settings } from './models';
import { SettingsRepository } from './settings.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingType } from './models/setting.entity';
import { CreateSettingDTO } from './dto/CreateSettingDTO';
import { FindSettingDTO } from './dto/FindSettingDTO';
import { UpdateSettingDTO } from './dto/UpdateSettingDTO';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: SettingsRepository,
  ) { }

  create(setting: CreateSettingDTO) {
    return this.settingsRepository.save(setting as Settings);
  }

  createKey(key: string) {
    return this.settingsRepository.save({ key, value: this.getDefaults(key), type: this.getType(key) });
  }

  async find(searchModel?: FindSettingDTO) {
    if (searchModel?.key) {
      return (await this.settingsRepository.find({ where: { key: searchModel.key } })) || [];
    }

    if (searchModel?.type) {
      return (await this.settingsRepository.find({ where: { type: searchModel.type as any } })) || [];
    }

    return (await this.settingsRepository.find()) || [];
  }

  async findByKey(key: string) {
    const [foundSetting] = (await this.find({ key })) || [];

    return foundSetting;
  }

  /**
   * Update setting with give key. If none is present, one will be created with defaults
   */
  async update({ key, ...update }: UpdateSettingDTO) {
    const [foundKey] = (await this.find({ key })) || [];

    if (foundKey) {
      return this.settingsRepository.save({ ...foundKey, ...update });
    }

    return this.create({ key, value: update.value || this.getDefaults(key), type: update.type || this.getType(key) });
  }

  remove(id: number) {
    return this.settingsRepository.delete(id);
  }

  private getType(key: string) {
    if (key === 'currentYear') {
      return SettingType.NUMBER;
    }

    if (key === 'currentSeason') {
      return SettingType.STRING;
    }

    if (key === 'defaultSubgroup') {
      return SettingType.STRING;
    }
  }

  private getDefaults(key: string) {
    if (key === 'currentYear') {
      return '2020';
    }

    if (key === 'currentSeason') {
      return 'fall';
    }

    if (key === 'defaultSubgroup') {
      return 'Erai-raws';
    }
  }
}
