import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeriesUpdate1626580911203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // @ts-ignore
    //  await queryRunner.addColumn('series', { name: 'showName', type: 'text', isNullable: true });
    await queryRunner.query('ALTER TABLE "series" ADD "showName" text');

    // @ts-ignore
    // await queryRunner.addColumn('series', { name: 'offset', type: 'integer', isNullable: true, default: 0 });
    await queryRunner.query('ALTER TABLE "series" ADD "offset" integer DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('series', 'showName');
    await queryRunner.dropColumn('series', 'offset');
  }
}
