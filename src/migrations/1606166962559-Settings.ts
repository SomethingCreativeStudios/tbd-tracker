import {MigrationInterface, QueryRunner} from "typeorm";

export class Settings1606166962559 implements MigrationInterface {
    name = 'Settings1606166962559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "value" character varying NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "airingData" SET DEFAULT '"2020-11-23T21:29:36.545Z"'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT array[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "airingData" SET DEFAULT '2020-11-22'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`DROP TABLE "settings"`);
    }

}
