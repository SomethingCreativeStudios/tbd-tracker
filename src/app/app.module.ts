import { SeriesModule } from './../modules/series/series.module';
import { SeasonModule } from './../modules/season/season.module';
import { Module, CacheModule, CacheInterceptor } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '../config';
import { UserModule } from '../modules/user';
import { TypeOrmOptions } from '../database';
import { TaskModule } from '../modules/tasks';
import { SubgroupModule } from '../modules/sub-group';
import { SubgroupRuleModule } from '../modules/sub-group-rule/sub-group-rule.module';
import { AnimeFolderService } from '../modules/anime-folder/anime-folder.service';
import { SocketModule } from '../modules/socket/socket.module';
import { AppGateway } from './app.gateway';
import { NyaaModule } from '../modules/nyaa/nyaa.module';
import { AnimeFolderModule } from '../modules/anime-folder/anime-folder.module';
import { SettingsModule } from '../modules/settings/settings.module';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    CacheModule.register(),
    SeriesModule,
    SeasonModule,
    UserModule,
    ConfigModule,
    TaskModule,
    SubgroupModule,
    SubgroupRuleModule,
    SocketModule,
    NyaaModule,
    AnimeFolderModule,
    SettingsModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptions,
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    AppService,
    AnimeFolderService,
    AppGateway,
  ],
})
export class AppModule {
  constructor(private readonly connection: Connection) {}
}
