import { Repository } from 'typeorm';
import { MediaItem } from './models/media.entity';

export class MediaRepository extends Repository<MediaItem> {}
