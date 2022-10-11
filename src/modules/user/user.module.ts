import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './models';
import { UserService } from './user.service';
import { RoleModule } from '../role/role.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RoleModule, SocketModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
