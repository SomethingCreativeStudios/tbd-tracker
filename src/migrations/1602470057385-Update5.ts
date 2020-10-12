import {MigrationInterface, QueryRunner} from "typeorm";

export class Update51602470057385 implements MigrationInterface {
    name = 'Update51602470057385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ADD "folderPath" character varying DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "series" ADD "downloaded" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "sub_group" ADD "seriesId" integer`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "airingData" SET DEFAULT '"2020-10-12T02:34:35.881Z"'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "sub_group" ADD CONSTRAINT "FK_00ec54e710bf9b3e7433632e45f" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sub_group" DROP CONSTRAINT "FK_00ec54e710bf9b3e7433632e45f"`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "airingData" SET DEFAULT '2020-10-12 01:28:29.326'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "sub_group" DROP COLUMN "seriesId"`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "downloaded"`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "folderPath"`);
    }

}
