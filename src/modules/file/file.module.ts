import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { SocketModule } from '../socket/socket.module';
import { FileGateway } from './file.gateway';
import { FileService } from './file.service';

@Module({
  imports: [GlobalCacheModule, SocketModule],
  providers: [FileService, FileGateway],
  exports: [FileService],
})
export class FileModule {}
