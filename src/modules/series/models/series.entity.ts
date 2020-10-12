import { Season } from '../../season/models';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { SubGroup } from '../../../modules/sub-group/models';

export enum WatchingStatus {
  WATCHInG = 'watching',
  WATCHED = 'watched',
  THREE_RULE = 'three_rule',
  NOT_WATCHING = 'not_watching',
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

  @Column({ default: new Date() })
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

  continuing: boolean = false;

  @ManyToOne(
    type => Season,
    season => season.series,
  )
  season: Season;

  @OneToMany(
    type => SubGroup,
    group => group.series,
    { cascade: true },
  )
  subgroups: SubGroup[];
}
