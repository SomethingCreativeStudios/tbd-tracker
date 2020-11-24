import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  value: string;

  @Column()
  type: SettingType;
}
