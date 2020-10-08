import { Series } from '../../../modules/series/models/series.entitiy';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Season {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: SeasonName;

  @Column()
  year: number;

  @Column()
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
