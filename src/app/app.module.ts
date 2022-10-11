import { SeriesModule } from './../modules/series/series.module';
import { SeasonModule } from './../modules/season/season.module';
import { Module, CacheInterceptor } from '@nestjs/common';
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
import { SessionModule } from '../modules/session/session.module';
import { AuthModule } from '../modules/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GlobalCacheModule } from '~/modules/global-cache/global-cache.module';
import { MalModule } from '~/modules/mal/mal.module';

@Module({
  imports: [
    ConfigModule,
    SeriesModule,
    SeasonModule,
    TaskModule,
    SubgroupModule,
    SubgroupRuleModule,
    SocketModule,
    NyaaModule,
    AnimeFolderModule,
    SettingsModule,
    UserModule,
    AuthModule,
    SessionModule,
    GlobalCacheModule,
    MalModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptions,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AnimeFolderService,
    AppGateway
  ],
})
export class AppModule {
  constructor() { }
}
