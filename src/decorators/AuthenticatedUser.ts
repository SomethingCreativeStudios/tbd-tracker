import { AuthUser } from '~/modules/auth/interfaces/auth-user.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthenticatedUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return request.user as AuthUser;
});
