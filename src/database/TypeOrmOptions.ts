import { Inject } from '@nestjs/common';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { ConfigService } from '../config';

import { MediaItem } from '../modules/media/models/media.entity';
import { AnimeFolderRule } from '../modules/anime-folder/models';
import { Season } from '../modules/season/models/season.entity';
import { Series } from '../modules/series/models/series.entity';
import { Settings } from '../modules/settings/models/setting.entity';
import { SubGroup } from '../modules/sub-group/models/sub-group.entity';
import { SubGroupRule } from '../modules/sub-group-rule/models/sub-group-rule.entity';
import { Task } from '../modules/tasks/models/task.entity';
import { User } from '../modules/user';
import { Role } from '../modules/role';
import { IgnoreLink } from '../modules/ignore-link/models/ignore-link.entity';

export class TypeOrmOptions implements TypeOrmOptionsFactory {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  createTypeOrmOptions(): PostgresConnectionOptions {
    return {
      type: 'postgres',
      host: this.configService.databaseHostName,
      port: this.configService.databasePort,
      username: this.configService.databaseUserName,
      password: this.configService.databasePassword,
      database: 'tbd',
      synchronize: this.configService.firstRun,
      logging: false,
      migrationsRun: true,
      entities: [MediaItem, AnimeFolderRule, Season, Series, Settings, SubGroup, SubGroupRule, Task, User, Role, IgnoreLink],
      migrations: [`./dist/src/migrations/*{.ts,.js}`],
    };
  }
}
