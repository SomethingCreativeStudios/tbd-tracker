import { CACHE_MANAGER, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { sync as createId } from 'uid-safe';
import { AccessToken } from './interfaces/interfaces';
import { RoleName } from '../../decorators/RolesDecorator';
import { UserService } from '../user/user.service';
import { AuthUser } from './interfaces/auth-user.interface';

/**
 @typedef accessToken
 @type {Object}
 @property {number} x The x coordinate.
 @property {number} y The y coordinate.
 */

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) { }

  async createSessionId(roleNames: RoleName[]): Promise<AccessToken> {
    const sessionId = createId(24);

    // set each token for 2 weeks
    // ttl is in seconds
    await this.cacheManager.set(`sess:${sessionId}`, { roleNames } as AuthUser, 86400 * 14);

    return {
      accessToken: sessionId,
      roles: roleNames,
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (user && (await this.userService.samePassword(user, password))) {
      return user;
    }

    return null;
  }
}
