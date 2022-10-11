import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RoleName } from '../decorators/RolesDecorator';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '~/modules/auth/interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<RoleName[]>('roles', context.getHandler());

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    return user && user.roleNames && this.hasAnyRole(user.roleNames, roles);
  }

  private hasAnyRole(userRoles: RoleName[], requestRoles: RoleName[]): boolean {
    return userRoles.reduce((alc: boolean, userRole: RoleName) => {
      return alc ? this.hasRole(userRole, requestRoles) : false;
    }, true);
  }

  private hasRole(role: RoleName, rolesToTest: RoleName[]) {
    return rolesToTest.some((roleToTest) => {
      return role <= roleToTest;
    });
  }
}
