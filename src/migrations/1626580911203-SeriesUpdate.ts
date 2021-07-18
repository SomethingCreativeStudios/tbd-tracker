import { MigrationInterface, QueryRunner } from 'typeorm';
import { Series } from '~/modules/series/models';

export class SeriesUpdate1626580911203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // @ts-ignore
    queryRunner.addColumn('series', { name: 'showName', type: 'character', isNullable: true, default: '' });

    // @ts-ignore
    queryRunner.addColumn('series', { name: 'offset', type: 'integer', isNullable: true, default: 0 });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropColumn('series', 'showName');
    queryRunner.dropColumn('series', 'offset');
  }
}
