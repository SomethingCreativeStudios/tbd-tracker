
import { PrimaryGeneratedColumn, Entity, Column, ManyToMany, JoinTable, ManyToOne, OneToMany } from 'typeorm';
import { Role } from '../../role';
import { Session } from '../../session/models/session.entity';

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

  //@OneToMany(type => Session, session => session.user)
  sessions: Session[];
}
