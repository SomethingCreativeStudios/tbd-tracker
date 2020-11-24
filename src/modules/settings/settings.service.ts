import { Injectable } from '@nestjs/common';
import { Settings } from './models';
import { SettingsRepository } from './series.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingType } from './models/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  create(setting: Settings) {
    return this.settingsRepository.create(setting);
  }

  createKey(key: string) {
    return this.settingsRepository.save({ key, value: this.getDefaults(key), type: this.getType(key) });
  }

  findAll() {
    return this.settingsRepository.find();
  }

  async findByKey(key: string) {
    return (await this.settingsRepository.findOne({ where: { key } })) || this.createKey(key);
  }

  update(setting: Settings) {
    return this.settingsRepository.save(setting);
  }

  remove(id: number) {
    this.settingsRepository.delete(id);
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
