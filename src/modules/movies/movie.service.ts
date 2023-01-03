import { Injectable } from '@nestjs/common/decorators';
import { Worker } from 'worker_threads';
import { MediaService } from '../media/media.service';
import { MediaCollection } from '../media/models/media.entity';
import { PirateScrapper } from '../scrapers/pirate.scraper';
import { SocketService } from '../socket/socket.service';
import { splitEvery } from 'ramda';

export enum SourceLocation {
  THE_PIRATE_BAY = 'the-pirate-bay',
}

@Injectable()
export class MovieService {
  constructor(private readonly mediaService: MediaService, private readonly socketService: SocketService) {}

  async find(query: string, source = SourceLocation.THE_PIRATE_BAY): Promise<MediaCollection[]> {
    const foundMedia = [] as MediaCollection[];
    const items = [];

    if (source === SourceLocation.THE_PIRATE_BAY) {
      const found = await PirateScrapper.search(query);

      for (const item of found) {
        const collection = new MediaCollection();

        collection.link = item.magUrl;
        collection.name = item.name;
        collection.parsedName = item.parsedName;
        collection.items = [];
        foundMedia.push(collection);

        items.push({ link: item.magUrl, name: item.parsedName });
      }
    }
    this.spawnWorker(5, items);

    return foundMedia;
  }

  async findMeta(name: string) {
    return this.mediaService.find(name);
  }

  private async spawnWorker(chunkCount: number, items: { link: string; name: string }[]) {
    const chunked = splitEvery(chunkCount, items);

    const message = ({ link, items }) => {
      this.socketService.movieSocket.emit('updated-meta', { link, items });
    };
    
    chunked.forEach((chunk) => {
      const worker = new Worker('./worker/media-search.js', { workerData: { data: chunk } });
      worker.on('message', message);
    });
  }
}
