import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../global-cache/global-cache.module';
import { MediaModule } from '../media/media.module';
import { SocketModule } from '../socket/socket.module';
import { MovieGateway } from './movie.gateway';
import { MovieService } from './movie.service';

@Module({
  imports: [GlobalCacheModule, SocketModule, MediaModule],
  providers: [MovieService, MovieGateway],
  exports: [MovieService],
})
export class MovieModule {}
