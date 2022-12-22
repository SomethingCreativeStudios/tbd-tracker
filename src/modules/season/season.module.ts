import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesModule } from '../series/series.module';
import { Season } from './models/season.entity';
import { SeasonService } from './season.service';
import { SettingsModule } from '../settings/settings.module';
import { SocketModule } from '../socket/socket.module';
import { MalModule } from '../mal';

@Module({
  imports: [TypeOrmModule.forFeature([Season]), forwardRef(() => SeriesModule), SettingsModule, MalModule, SocketModule],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule { }
