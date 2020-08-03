import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './models';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth';
import { RoleModule } from '../role';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, RoleModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
