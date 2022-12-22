import { Module, CacheModule } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '../../config';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.redisConfig.host,
        port: configService.redisConfig.port,
        ttl: 0,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class GlobalCacheModule {}
