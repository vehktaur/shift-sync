import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.authService.resolveSessionUser(request);

    if (!user) {
      throw new HttpException(
        { message: 'Authentication required.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = user;
    return true;
  }
}
