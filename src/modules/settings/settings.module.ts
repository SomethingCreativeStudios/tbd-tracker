import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Settings } from './models';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsGateway } from './settings.gateway';
import { GlobalCacheModule } from '../global-cache/global-cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Settings]), GlobalCacheModule],
  providers: [SettingsService, SettingsGateway],
  exports: [SettingsService],
})
export class SettingsModule { }
