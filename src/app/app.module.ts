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

@Module({
  imports: [
    UserModule,
    ConfigModule,
    TaskModule,
    SubgroupModule,
    SubgroupRuleModule,
    SocketModule,
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptions,
    }),
  ],
  controllers: [AppController],
  providers: [NyaaService, AppService, AnimeFolderService, AppGateway],
})
export class AppModule {
  constructor(private readonly connection: Connection) {}
}
