import { SeriesModule } from './../modules/series/series.module';
import { SeriesService } from './../modules/series/series.service';
import { SeriesController } from './../modules/series/series.controller';
import { SeasonModule } from './../modules/season/season.module';
import { SeasonService } from './../modules/season/season.service';
import { SeasonController } from './../modules/season/season.controller';
import { NyaaService } from '../modules/nyaa/nyaa.service';
import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptions,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AnimeFolderService, AppGateway],
})
export class AppModule {
  constructor(private readonly connection: Connection) {}
}
