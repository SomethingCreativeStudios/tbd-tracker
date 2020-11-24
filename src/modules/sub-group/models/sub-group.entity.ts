import { PrimaryGeneratedColumn, Entity, Column, OneToMany, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { SubGroupRule } from '../../sub-group-rule/models/sub-group-rule.entity';
import { Series } from '../../../modules/series/models';

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

  @ManyToOne(
    type => Series,
    series => series.subgroups,
  )
  series: Series;

  setText(text: string) {
    this.name = text;
    return this;
  }

  addRule(rule: SubGroupRule) {
    this.rules = this.rules ? this.rules.concat(rule) : [rule];
    return this;
  }
}
