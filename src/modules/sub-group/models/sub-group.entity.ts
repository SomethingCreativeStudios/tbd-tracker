import { PrimaryGeneratedColumn, Entity, Column, OneToMany, JoinColumn } from 'typeorm';
import { SubGroupRule } from '../../sub-group-rule/models/sub-group-rule.entity';

@Entity()
export class SubGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  preferedResultion: '720' | '1080' | '480';

  @OneToMany(
    type => SubGroupRule,
    rule => rule.subGroup,
    { cascade: true },
  )
  rules: SubGroupRule[];

  setText(text: string) {
    this.name = text;
    return this;
  }

  addRule(rule: SubGroupRule) {
    this.rules = this.rules ? this.rules.concat(rule) : [rule];
    return this;
  }
}
