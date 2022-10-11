import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './models/session.entity';
import { UserModule } from '../user';
import { SessionService } from './session.service';

@Module({
    imports: [TypeOrmModule.forFeature([Session]), UserModule],
    providers: [SessionService],
    exports: [SessionService],
})
export class SessionModule { }
