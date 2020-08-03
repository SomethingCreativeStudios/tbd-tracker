import { TypeOrmOptions } from '../src/database/TypeOrmOptions';
import { ConfigService } from '../src/config/config.service';
import { writeFileSync } from 'fs';

const type = new TypeOrmOptions(new ConfigService());
writeFileSync(
  'ormconfig.json',
  JSON.stringify(
    {
      ...type.createTypeOrmOptions(),
      entities: ['./**/models/*.entity.ts'],
      migrations: [`src/migrations/**/*{.ts,.js}`],
    },
    null,
    2,
  ),
);
