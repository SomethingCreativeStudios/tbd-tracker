import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { Settings } from './models';
import { SettingType } from './models/setting.entity';

@ApiTags('Settings')
@Controller('/api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  create(@Body() settings: Settings) {
    return this.settingsService.create(settings);
  }

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put()
  update(@Body() setting: Settings) {
    return this.settingsService.update(setting);
  }

  @Put(':key')
  async updateByKey(@Param('key') key: string, @Body() { value }: { value: string }) {
    const foundKey = (await this.settingsService.findByKey(key)) || (await this.settingsService.createKey(key));
    return this.settingsService.update({ ...foundKey, value });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.settingsService.remove(+id);
  }
}
