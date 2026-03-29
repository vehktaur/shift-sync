import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser, UsersResponse } from '../auth/auth.types';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(SessionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@CurrentUser() viewer: SessionUser): UsersResponse {
    return {
      viewer,
      users: this.usersService.getScopedUsers(viewer),
    };
  }
}
