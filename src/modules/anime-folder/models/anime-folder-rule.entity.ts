import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm';
import { RuleType } from '../../sub-group-rule/models/sub-group-rule.entity';

@Entity()
export class AnimeFolderRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  folderName: string;

  @Column()
  textMatch: string;

  @Column()
  ruleType: RuleType;
}
