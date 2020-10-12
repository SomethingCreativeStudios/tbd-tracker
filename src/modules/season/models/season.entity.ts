import { Series } from '../../series/models/series.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Season {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: SeasonName;

  @Column()
  year: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  overallScore: number;

  @OneToMany(
    type => Series,
    series => series.season,
    { cascade: true },
  )
  series: Series[];
}

export enum SeasonName {
  FALL = 'fall',
  WINTER = 'winter',
  SUMMER = 'summer',
  SPRING = 'spring',
}

export function toSeasonName(name: string) {
  if (name === 'fall') {
    return SeasonName.FALL;
  }

  if (name === 'winter') {
    return SeasonName.WINTER;
  }

  if (name === 'summer') {
    return SeasonName.SUMMER;
  }

  if (name === 'spring') {
    return SeasonName.SPRING;
  }

  return SeasonName.FALL;
}
