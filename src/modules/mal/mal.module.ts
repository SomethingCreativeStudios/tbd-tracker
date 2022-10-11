import { Module } from "@nestjs/common";
import { ConfigModule } from "~/config";
import { AnimeFolderModule } from "../anime-folder/anime-folder.module";
import { GlobalCacheModule } from "../global-cache/global-cache.module";
import { UserModule } from "../user";
import { MalGateway } from "./mal.gateway";
import { MalService } from "./mal.service";


@Module({
    imports: [ConfigModule, UserModule, GlobalCacheModule, AnimeFolderModule],
    providers: [MalService, MalGateway],
    exports: [MalService],
})
export class MalModule { }
