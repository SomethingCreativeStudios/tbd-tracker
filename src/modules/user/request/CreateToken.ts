import { ApiProperty } from '@nestjs/swagger';

/**
 * Request used in users/auth endpoint
 */
export class CreateToken {
  /**
   * Name of user
   */
  @ApiProperty({ description: 'Name of user' })
  username: string;
  /**
   * Password of user
   */
  @ApiProperty({ description: 'Password of user' })
  password: string;
}
