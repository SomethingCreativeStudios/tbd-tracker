import { Inject } from '@nestjs/common';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { ConfigService } from '../config';

import { getMetadataArgsStorage } from 'typeorm';

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
      migrationsRun: false,
      entities: getMetadataArgsStorage().tables.map(tbl => tbl.target),
      migrations: [`./dist/migrations/*{.ts,.js}`],
      cli: {
        migrationsDir: `src/migrations`,
      },
    };
  }
}
