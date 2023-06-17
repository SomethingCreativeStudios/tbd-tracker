import { MigrationInterface, QueryRunner } from 'typeorm';

export class IgnoreLinks1687031874693 implements MigrationInterface {
  name = 'IgnoreLinks1687031874693';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ignore_link" ("id" SERIAL NOT NULL, "link" text NOT NULL, CONSTRAINT "PK_a488ccf34c780c6837eb5f49311" PRIMARY KEY ("id"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ignore_link"`);
  }
}
