import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm';

@Entity()
export class TrackedAnime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;
}
