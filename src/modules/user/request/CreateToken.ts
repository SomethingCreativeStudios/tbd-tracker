import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  /**
   * Time to live. How long will the jwt token last, in seconds
   */
  @ApiPropertyOptional({ description: 'How long the token will be active', default: '5 Mins' })
  ttl: number;
}
