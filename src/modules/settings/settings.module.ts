import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Settings } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsGateway } from './settings.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  providers: [SettingsService, SettingsGateway],
  exports: [SettingsService],
})
export class SettingsModule {}
