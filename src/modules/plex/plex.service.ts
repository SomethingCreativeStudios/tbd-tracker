import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '~/config';
import { LibraryType } from './models/plex.model';

@Injectable()
export class PlexService {
  private plexUrl: string;

  constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {
    this.plexUrl = this.configService.plexConfig.plexUrl;
  }

  public async refresh(type: LibraryType) {
    const id = this.getLibrary(type);
    const test = this.httpService.get(`${this.plexUrl}/library/sections/${id}/refresh?X-Plex-Token=${this.configService.plexConfig.accessToken}`);
    await test.toPromise();
  }

  private getLibrary(type: LibraryType) {
    if (type === LibraryType.MOVIE) {
      return this.configService.plexConfig.movieLibrary;
    }

    if (type === LibraryType.TV_SHOW) {
      return this.configService.plexConfig.tvShowLibrary;
    }

    if (type === LibraryType.ANIME) {
      return this.configService.plexConfig.animeLibrary;
    }

    return 0;
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async refreshSync() {
    console.log('Syncing Plex');
    await this.refresh(LibraryType.MOVIE);
    await this.refresh(LibraryType.TV_SHOW);
    console.log('Syncing Plex Done');
  }
}
