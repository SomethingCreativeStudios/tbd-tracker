import { Season } from '../../../modules/season/models/season.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';

@Entity()
export class Series {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  studio: string;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  airingData: Date;

  @Column()
  numberOfEpisodes: number;

  @Column()
  score: number;

  @Column({ type: 'text', array: true })
  genres: string[];

  @Column({ type: 'text', array: true })
  tags: string[];

  @ManyToOne(
    type => Season,
    season => season.series,
  )
  season: Season;
}
