import { TypeOrmOptions } from '../src/database/TypeOrmOptions';
import { TestTypeOrmOptions } from '../src/database/TestTypeOrmOptions';
import { ConfigService } from '../src/config/config.service';
import { writeFileSync } from 'fs';

let type = null;
console.log(process.argv);
if (process.argv[2] === 'test') {
  type = new TypeOrmOptions(new ConfigService());
} else {
  type = new TestTypeOrmOptions(new ConfigService());
}

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
