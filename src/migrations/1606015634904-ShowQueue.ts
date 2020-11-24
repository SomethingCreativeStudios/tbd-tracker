import {MigrationInterface, QueryRunner} from "typeorm";

export class ShowQueue1606015634904 implements MigrationInterface {
    name = 'ShowQueue1606015634904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ADD "showQueue" jsonb DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "airingData"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "airingData" date NOT NULL DEFAULT '"2020-11-22T03:27:34.080Z"'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT array[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "airingData"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "airingData" TIMESTAMP NOT NULL DEFAULT '2020-10-12 02:34:35.881'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "showQueue"`);
    }

}
