import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface MediaLink {
  name: string;
  url: string;
}

export class MediaCollection {
  items: MediaItem[];
  link: string;
  name: string;
  parsedResolution: '720' | '1080' | '480' | 'NOT_FOUND';
  parsedName: string;
}
@Entity()
export class MediaItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  displayName: string;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  associatedLinks: MediaLink[];

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text' })
  imagePath: string;

  @Column({ type: 'timestamp' })
  releaseDate: Date;
}
