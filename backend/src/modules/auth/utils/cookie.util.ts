import type { Response } from 'express';
import { getEnv } from '@config/env.js';
import { AUTH_COOKIE_NAMES } from '@modules/auth/constants/auth.constants.js';
import { TokenService } from '@modules/auth/services/token.service.js';

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const env = getEnv();
  if (!env.AUTH_USE_HTTP_ONLY_COOKIES) {
    return;
  }

  const baseOptions = {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    path: '/',
  };

  res.cookie(AUTH_COOKIE_NAMES.ACCESS, accessToken, {
    ...baseOptions,
    maxAge: TokenService.getAccessTokenMaxAgeMs(),
  });

  res.cookie(AUTH_COOKIE_NAMES.REFRESH, refreshToken, {
    ...baseOptions,
    maxAge: TokenService.getRefreshTokenMaxAgeMs(),
  });
}

export function clearAuthCookies(res: Response): void {
  const env = getEnv();
  if (!env.AUTH_USE_HTTP_ONLY_COOKIES) {
    return;
  }

  res.clearCookie(AUTH_COOKIE_NAMES.ACCESS, { path: '/' });
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH, { path: '/' });
}

export function extractRefreshToken(
  bodyToken: string | undefined,
  cookieToken: string | undefined,
): string | undefined {
  return bodyToken ?? cookieToken;
}
