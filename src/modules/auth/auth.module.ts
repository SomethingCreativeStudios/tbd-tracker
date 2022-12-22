import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '../../config';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { UserModule } from '../user/user.module';
import { SessionStrategy } from './session.strategy';
import { AuthGateway } from './auth.gateway';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    PassportModule,
    UserModule,
    GlobalCacheModule,
    RoleModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          secretOrPrivateKey: configService.secretKey,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AuthGateway, SessionStrategy],
  exports: [AuthService, SessionStrategy],
})
export class AuthModule { }
