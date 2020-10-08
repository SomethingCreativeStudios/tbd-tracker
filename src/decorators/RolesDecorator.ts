/* tslint:disable */
import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export function Roles(...roles: RoleName[]) {
  return applyDecorators(SetMetadata('roles', roles));
}

export enum RoleName {
  SUPER_ADMIN = -1,
  ADMIN = 0,
  USER = 1,
}
