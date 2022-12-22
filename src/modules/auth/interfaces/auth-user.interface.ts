import { RoleName } from '~/decorators/RolesDecorator';

export interface AuthUser {
  roleNames: RoleName[];
}
