import {MigrationInterface, QueryRunner} from "typeorm";

export class Update31602403510266 implements MigrationInterface {
    name = 'Update31602403510266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "score"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "score" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "overallScore"`);
        await queryRunner.query(`ALTER TABLE "season" ADD "overallScore" numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season" DROP COLUMN "overallScore"`);
        await queryRunner.query(`ALTER TABLE "season" ADD "overallScore" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "score"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "score" integer NOT NULL`);
    }

}
