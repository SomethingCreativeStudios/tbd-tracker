import { PrimaryGeneratedColumn, Entity, Column, ManyToOne } from 'typeorm';
import { SubGroup } from '../../sub-group/models';

@Entity()
export class SubGroupRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column()
  ruleType: RuleType;

  @Column()
  isPositive: boolean;

  @ManyToOne(
    type => SubGroup,
    group => group.rules,
  )
  subGroup: SubGroup;

}

export enum RuleType {
  CONTAINS = 'contains',
  STARTS_WITH = 'starts with',
  ENDS_WITH = 'ends with',
  REGEX = 'regex',
  BLANK = 'blank',
}
