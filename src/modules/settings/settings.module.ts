import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Settings } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsGateway } from './settings.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsGateway],
  exports: [SettingsService],
})
export class SettingsModule {}
