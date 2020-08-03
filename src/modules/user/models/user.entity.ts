import { PrimaryGeneratedColumn, Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../../role';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @ManyToMany(type => Role, { cascade: true })
  @JoinTable()
  roles: Role[];
}
