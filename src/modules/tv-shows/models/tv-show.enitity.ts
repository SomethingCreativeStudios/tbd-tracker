import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface TvEposide {
  name: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  airingDate: Date;
}

export interface TvSeason {
  eposides: TvEposide[];
  airingDate: Date;
  seasonNumber: number;
}

@Entity()
export class TvShow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: '' })
  displayName: string;

  @Column({ nullable: true, default: '' })
  description: string;

  @Column({ nullable: true, default: '' })
  posterURL: string;

  @Column({ nullable: true, default: 0 })
  episodeCount: number;

  @Column({ nullable: true, default: 0 })
  seasonCount: number;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  seasons: TvSeason[];

  @Column({ type: 'text', array: true, default: () => 'array[]::text[]' })
  searchTerms: string[];
}
