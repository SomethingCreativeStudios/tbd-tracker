import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './models/JwtPayload';
import { AccessToken } from './interfaces/interfaces';
import { RoleName } from '../../decorators/RolesDecorator';

/**
 @typedef accessToken
 @type {Object}
 @property {number} x The x coordinate.
 @property {number} y The y coordinate.
 */

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Create new JWT token
   * @param roleNames Roles the token allows
   * @param expiresIn How long is the token valid for
   * @returns {accessToken} object with token
   */
  async createToken(roleNames: RoleName[], expiresIn: number): Promise<AccessToken> {
    const user: JwtPayload = { roles: roleNames };
    const accessToken = this.jwtService.sign(user, {
      expiresIn,
    });
    return {
      accessToken,
    };
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    return true;
  }
}
