import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class IgnoreLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  link: string;

}