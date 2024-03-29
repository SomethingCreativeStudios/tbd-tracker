import { Injectable, CanActivate, ExecutionContext, CACHE_MANAGER, Inject } from "@nestjs/common";
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';
import { Reflector } from "@nestjs/core";

@Injectable()
export class SocketGuard implements CanActivate {
    constructor(
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient<Socket>();

        if (!client.handshake.auth.token) {
            return false;
        }

        const found = await this.cacheManager.get(`sess:${client.handshake.auth.token}`);

        return !!found;
    }
}
