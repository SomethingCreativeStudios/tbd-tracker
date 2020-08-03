import { RoleName } from '../../../decorators/RolesDecorator';

export interface JwtPayload {
  roles: RoleName[];
}
