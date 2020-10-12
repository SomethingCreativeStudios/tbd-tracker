import {MigrationInterface, QueryRunner} from "typeorm";

export class Update41602466093143 implements MigrationInterface {
    name = 'Update41602466093143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ADD "watchStatus" text NOT NULL DEFAULT 'not_watching'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "name" SET DEFAULT 'series name'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "studio" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "airingData" SET DEFAULT '"2020-10-12T01:28:29.326Z"'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "numberOfEpisodes" SET DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "season" ADD "name" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "season" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "numberOfEpisodes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "airingData" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "studio" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "watchStatus"`);
    }

}
