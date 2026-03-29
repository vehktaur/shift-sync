import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import type { Response } from 'express';

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from './auth.constants';
import type { SessionTokenPayload } from './auth.types';

@Injectable()
export class SessionService {
  private readonly sessionSecret =
    process.env.SESSION_SECRET ?? 'shift-sync-dev-session-secret';

  private readonly secureCookies = process.env.SESSION_COOKIE_SECURE === 'true';

  private readonly encodedSecret = new TextEncoder().encode(this.sessionSecret);

  async createSessionToken(payload: SessionTokenPayload) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
      .sign(this.encodedSecret);
  }

  async verifySessionToken(token?: string | null) {
    if (!token) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, this.encodedSecret, {
        algorithms: ['HS256'],
      });

      return payload as SessionTokenPayload;
    } catch {
      return null;
    }
  }

  async persistSession(
    response: Response,
    payload: SessionTokenPayload,
  ): Promise<void> {
    const sessionToken = await this.createSessionToken(payload);

    response.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secureCookies,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    });
  }

  clearSession(response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secureCookies,
      path: '/',
    });
  }
}
