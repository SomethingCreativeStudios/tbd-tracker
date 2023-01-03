import { MigrationInterface, QueryRunner } from "typeorm";

export class MediaItem1672433734610 implements MigrationInterface {
    name = 'MediaItem1672433734610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "media_item" ("id" SERIAL NOT NULL, "displayName" text NOT NULL, "associatedLinks" jsonb DEFAULT '[]', "description" text NOT NULL, "rating" integer NOT NULL, "imagePath" text NOT NULL, "releaseDate" TIMESTAMP NOT NULL, CONSTRAINT "PK_ca307a9a9117b0c8edc6eb4cd97" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "media_item"`);
    }

}
