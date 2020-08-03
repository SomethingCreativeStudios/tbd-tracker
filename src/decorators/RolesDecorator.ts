/* tslint:disable */
import { ReflectMetadata } from '@nestjs/common';

export const Roles = (...roles: RoleName[]) => ReflectMetadata('roles', roles);

export enum RoleName {
  SUPER_ADMIN = -1,
  ADMIN = 0,
  USER = 1,
}
