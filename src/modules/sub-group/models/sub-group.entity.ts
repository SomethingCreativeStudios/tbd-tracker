import { PrimaryGeneratedColumn, Entity, Column, OneToMany } from 'typeorm';
import { SubGroupRule } from '../../sub-group-rule/models/sub-group-rule.entity';

@Entity()
export class SubGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  allPass: boolean;

  @OneToMany(
    type => SubGroupRule,
    rule => rule.subGroup,
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
