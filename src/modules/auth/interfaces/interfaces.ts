import { ApiProperty } from "@nestjs/swagger";
import { RoleName } from "~/decorators/RolesDecorator";

export class AccessToken {
  @ApiProperty({ name: 'AccessToken', description: 'session id' })
  accessToken: string;

  @ApiProperty({ name: 'Roles', description: 'user roles' })
  roles: RoleName[];
}
