import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { SessionGuard } from './session.guard';
import type {
  DemoAccountsResponse,
  LoginRequestBody,
  LoginResponse,
  SessionResponse,
  SessionUser,
} from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('demo-accounts')
  getDemoAccounts(): DemoAccountsResponse {
    return this.authService.getDemoAccounts();
  }

  @Post('login')
  async login(
    @Body() requestBody: LoginRequestBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    return this.authService.login(requestBody, response);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    this.authService.logout(response);
    return { success: true };
  }

  @UseGuards(SessionGuard)
  @Get('me')
  getMe(@CurrentUser() user: SessionUser): SessionResponse {
    return { user };
  }
}
