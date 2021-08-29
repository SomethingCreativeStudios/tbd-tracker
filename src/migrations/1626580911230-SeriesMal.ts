import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeriesMal1626580911230 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // @ts-ignore
    await queryRunner.addColumn('series', { name: 'mal_id', type: 'integer', isNullable: true, default: 0 });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('series', 'mal_id');
  }
}
