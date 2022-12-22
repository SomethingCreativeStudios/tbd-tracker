import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '~/modules/user';

export type SessionType = 'LOCAL_AUTH' | 'MAL_AUTH';

@Entity()
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true, default: 'LOCAL_AUTH' })
  type: SessionType;

  @Column({ type: 'text', array: true, default: () => 'array[]::text[]' })
  payload: string[];

  @Column({ default: new Date(), type: 'timestamptz' })
  expireDate: Date;

  // @OneToMany(type => User, user => user.sessions)
  user: User;
}
