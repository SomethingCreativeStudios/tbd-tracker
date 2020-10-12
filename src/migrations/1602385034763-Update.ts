import {MigrationInterface, QueryRunner} from "typeorm";

export class Update1602385034763 implements MigrationInterface {
    name = 'Update1602385034763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "series" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "otherNames" text array NOT NULL, "studio" character varying NOT NULL, "description" character varying NOT NULL, "imageUrl" character varying NOT NULL, "airingData" TIMESTAMP NOT NULL, "numberOfEpisodes" integer NOT NULL, "score" integer NOT NULL, "genres" text array NOT NULL, "tags" text array NOT NULL, "seasonId" integer, CONSTRAINT "PK_e725676647382eb54540d7128ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "season" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "year" integer NOT NULL, "overallScore" integer NOT NULL, CONSTRAINT "PK_8ac0d081dbdb7ab02d166bcda9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "series" ADD CONSTRAINT "FK_6fd5f15fae5cd0a6d4a55ded6e3" FOREIGN KEY ("seasonId") REFERENCES "season"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "series" DROP CONSTRAINT "FK_6fd5f15fae5cd0a6d4a55ded6e3"`);
        await queryRunner.query(`DROP TABLE "season"`);
        await queryRunner.query(`DROP TABLE "series"`);
    }

}
