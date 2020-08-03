import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../../config';
import { TestTypeOrmOptions } from '../../database/TestTypeOrmOptions';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useClass: TestTypeOrmOptions,
    }),
  ],
  controllers: [],
  providers: [],
})
export class TestModule {}
