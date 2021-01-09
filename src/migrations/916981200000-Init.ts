import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1574681382000 implements MigrationInterface {
    name = 'Init1574681382000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "season" ("id" SERIAL NOT NULL, "name" text NOT NULL, "year" integer NOT NULL, "overallScore" numeric(5,2), CONSTRAINT "PK_8ac0d081dbdb7ab02d166bcda9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "series" ("id" SERIAL NOT NULL, "name" character varying DEFAULT 'series name', "otherNames" text array NOT NULL DEFAULT array[]::text[], "studio" character varying NOT NULL DEFAULT '', "folderPath" character varying DEFAULT '', "description" character varying NOT NULL, "imageUrl" character varying NOT NULL, "airingData" date NOT NULL DEFAULT '"2020-12-25T06:29:55.440Z"', "numberOfEpisodes" integer NOT NULL DEFAULT 0, "downloaded" integer NOT NULL DEFAULT 0, "score" numeric(5,2), "genres" text array NOT NULL DEFAULT array[]::text[], "tags" text array NOT NULL DEFAULT array[]::text[], "watchStatus" text NOT NULL DEFAULT 'not_watching', "showQueue" jsonb DEFAULT '[]', "seasonId" integer, CONSTRAINT "PK_e725676647382eb54540d7128ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sub_group" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "preferedResultion" character varying NOT NULL, "seriesId" integer, CONSTRAINT "PK_c447034fd51994aeac7ed6d8b88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sub_group_rule" ("id" SERIAL NOT NULL, "text" character varying NOT NULL, "ruleType" character varying NOT NULL, "isPositive" boolean NOT NULL, "subGroupId" integer, CONSTRAINT "PK_5ee2022e048830e9e36624b9028" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "anime_folder_rule" ("id" SERIAL NOT NULL, "folderName" character varying NOT NULL, "textMatch" character varying NOT NULL, "ruleType" character varying NOT NULL, CONSTRAINT "PK_e4d75e349b4a894a32a4cf56723" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "value" character varying NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tracked_anime" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_bad87d120e1278788488e04cae9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles_role" ("userId" integer NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_b47cd6c84ee205ac5a713718292" PRIMARY KEY ("userId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f9286e6c25594c6b88c108db7" ON "user_roles_role" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4be2f7adf862634f5f803d246b" ON "user_roles_role" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "series" ADD CONSTRAINT "FK_6fd5f15fae5cd0a6d4a55ded6e3" FOREIGN KEY ("seasonId") REFERENCES "season"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_group" ADD CONSTRAINT "FK_00ec54e710bf9b3e7433632e45f" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_group_rule" ADD CONSTRAINT "FK_190033f4b215f7bda76eb163177" FOREIGN KEY ("subGroupId") REFERENCES "sub_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_5f9286e6c25594c6b88c108db77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_4be2f7adf862634f5f803d246b8" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_4be2f7adf862634f5f803d246b8"`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_5f9286e6c25594c6b88c108db77"`);
        await queryRunner.query(`ALTER TABLE "sub_group_rule" DROP CONSTRAINT "FK_190033f4b215f7bda76eb163177"`);
        await queryRunner.query(`ALTER TABLE "sub_group" DROP CONSTRAINT "FK_00ec54e710bf9b3e7433632e45f"`);
        await queryRunner.query(`ALTER TABLE "series" DROP CONSTRAINT "FK_6fd5f15fae5cd0a6d4a55ded6e3"`);
        await queryRunner.query(`DROP INDEX "IDX_4be2f7adf862634f5f803d246b"`);
        await queryRunner.query(`DROP INDEX "IDX_5f9286e6c25594c6b88c108db7"`);
        await queryRunner.query(`DROP TABLE "user_roles_role"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "tracked_anime"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "anime_folder_rule"`);
        await queryRunner.query(`DROP TABLE "sub_group_rule"`);
        await queryRunner.query(`DROP TABLE "sub_group"`);
        await queryRunner.query(`DROP TABLE "series"`);
        await queryRunner.query(`DROP TABLE "season"`);
    }

}
