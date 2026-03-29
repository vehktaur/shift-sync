import {
  UnauthorizedException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return request.user;
  },
);
