import { MigrationInterface, QueryRunner } from "typeorm";

export class EpRegex1687039825210 implements MigrationInterface {
    name = 'EpRegex1687039825210'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_5f9286e6c25594c6b88c108db77"`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_4be2f7adf862634f5f803d246b8"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "episodeRegex" text DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "airingData"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "airingData" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '"2023-06-17T22:10:26.520Z"'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT array[]::text[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "showName" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "offset"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "offset" numeric DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "mal_id"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "mal_id" numeric DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_5f9286e6c25594c6b88c108db77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_4be2f7adf862634f5f803d246b8" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_4be2f7adf862634f5f803d246b8"`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_5f9286e6c25594c6b88c108db77"`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "mal_id"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "mal_id" integer DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "offset"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "offset" integer DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "showName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "tags" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "genres" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "airingData"`);
        await queryRunner.query(`ALTER TABLE "series" ADD "airingData" date NOT NULL DEFAULT '2020-11-23'`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "series" ALTER COLUMN "otherNames" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "series" DROP COLUMN "episodeRegex"`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_4be2f7adf862634f5f803d246b8" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_5f9286e6c25594c6b88c108db77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
