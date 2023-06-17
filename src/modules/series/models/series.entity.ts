import { Season } from '../../season/models';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { SubGroup } from '../../../modules/sub-group/models';
import { NyaaItem } from 'src/modules/nyaa/models/nyaaItem';

export enum WatchingStatus {
  WATCHING = 'watching',
  WATCHED = 'watched',
  THREE_RULE = 'three_rule',
  NOT_WATCHING = 'not_watching',
}

export enum SortBy {
  'QUEUE' = 'queue',
  'NAME' = 'name',
  'WATCH_STATUS' = 'watch_status',
}

@Entity()
export class Series {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: 'series name' })
  name: string;

  @Column({ type: 'text', array: true, default: () => 'array[]::text[]' })
  otherNames: string[];

  @Column({ default: '' })
  studio: string;

  @Column({ nullable: true, default: '' })
  folderPath: string;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @Column({ default: new Date(), type: 'timestamptz' })
  airingData: Date;

  @Column({ default: 0 })
  numberOfEpisodes: number;

  @Column({ default: 0 })
  downloaded: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'text', array: true, default: () => 'array[]::text[]' })
  genres: string[];

  @Column({ type: 'text', array: true, default: () => 'array[]::text[]' })
  tags: string[];

  @Column({ type: 'text', default: WatchingStatus.NOT_WATCHING })
  watchStatus: WatchingStatus;

  @Column({ type: 'text', default: '', nullable: true })
  showName?: string;

  @Column({ type: 'decimal', default: 0, nullable: true })
  offset?: number;

  @Column({ type: 'text', default: '', nullable: true })
  episodeRegex: string;

  continuing: boolean = false;

  @Column({ type: 'decimal', default: 0, nullable: true, name: 'mal_id' })
  malId: number;

  @ManyToOne((type) => Season, (season) => season.series)
  season: Season;

  @OneToMany((type) => SubGroup, (group) => group.series, { cascade: true })
  subgroups: SubGroup[];

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  showQueue: NyaaItem[];

  nextAiringDate?: Date;
}
