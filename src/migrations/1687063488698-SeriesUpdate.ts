import { MigrationInterface, QueryRunner } from "typeorm";

export class SeriesUpdate1687063488698 implements MigrationInterface {
    name = 'SeriesUpdate1687063488698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" ADD "hasSubgroupsPending" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "hasSubgroupsPending"`);
    }

}
