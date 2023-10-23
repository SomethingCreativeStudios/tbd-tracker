import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { Cache } from 'cache-manager';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'sessionid') {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {
    super();
  }

  async validate(request: Request): Promise<any> {
    console.log('Custom validation', request);

    return true;
  }

  async authenticate(request: any) {
    const token = request.headers['authorization']?.split('Bearer')?.[1]?.trim() ?? false;

    const foundSession = await this.cacheManager.get(`sess:${token}`);

    if (foundSession) {
      // @ts-ignore
      this.success(foundSession);
    } else {
      // @ts-ignore
      this.fail(null);
    }
  }
}
