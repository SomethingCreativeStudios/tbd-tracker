import { Module, Global } from '@nestjs/common';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { SocketService } from './socket.service';

@Global()
@Module({
  controllers: [],
  imports: [GlobalCacheModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule { }
