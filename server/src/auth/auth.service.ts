import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

import { DEMO_PASSWORD, SESSION_COOKIE_NAME } from './auth.constants';
import { RuntimeDataService } from '../database/runtime-data.service';
import { SessionService } from './session.service';
import type {
  DemoAccountsResponse,
  LoginRequestBody,
  LoginResponse,
  SessionUser,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly runtimeData: RuntimeDataService,
  ) {}

  getDemoAccounts(): DemoAccountsResponse {
    return {
      accounts: this.runtimeData.getDemoAccounts(),
      sharedPassword: DEMO_PASSWORD,
    };
  }

  async login(
    requestBody: LoginRequestBody,
    response: Response,
  ): Promise<LoginResponse> {
    const { email, password } = this.validateLoginRequest(requestBody);
    const user = this.runtimeData
      .getAllUsers()
      .find(
        (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
      );

    if (!user || password !== DEMO_PASSWORD) {
      throw new HttpException(
        { message: 'Invalid email or password.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.sessionService.persistSession(response, {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.runtimeData.toSessionUser(user),
      redirectTo: '/',
    };
  }

  logout(response: Response): void {
    this.sessionService.clearSession(response);
  }

  async resolveSessionUser(request: Request): Promise<SessionUser | null> {
    const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    const payload = await this.sessionService.verifySessionToken(token);

    if (!payload?.sub) {
      return null;
    }

    const user = this.runtimeData.getUserById(payload.sub);

    if (!user) {
      return null;
    }

    if (
      payload.email !== user.email ||
      payload.role !== user.role ||
      payload.name !== user.name
    ) {
      return null;
    }

    return this.runtimeData.toSessionUser(user);
  }

  private validateLoginRequest(requestBody: LoginRequestBody) {
    const email =
      typeof requestBody.email === 'string' ? requestBody.email.trim() : '';
    const password =
      typeof requestBody.password === 'string' ? requestBody.password : '';

    const fieldErrors: Record<string, string[] | undefined> = {};

    if (!email) {
      fieldErrors.email = ['Work email is required.'];
    } else if (!this.isValidEmail(email)) {
      fieldErrors.email = ['Enter a valid work email.'];
    }

    if (!password) {
      fieldErrors.password = ['Password is required.'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new HttpException(
        {
          message: 'Enter a valid work email and password.',
          fieldErrors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return { email, password };
  }

  private isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
