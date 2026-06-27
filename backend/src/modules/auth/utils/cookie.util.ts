import type { Response, CookieOptions } from 'express';
import { getEnv } from '@config/env.js';
import { AUTH_COOKIE_NAMES } from '@modules/auth/constants/auth.constants.js';
import { TokenService } from '@modules/auth/services/token.service.js';

function getBaseCookieOptions(): CookieOptions {
  const env = getEnv();
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
  };
  if (env.AUTH_COOKIE_DOMAIN) {
    options.domain = env.AUTH_COOKIE_DOMAIN;
  }
  return options;
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const env = getEnv();
  if (!env.AUTH_USE_HTTP_ONLY_COOKIES) {
    return;
  }

  const baseOptions = getBaseCookieOptions();

  res.cookie(AUTH_COOKIE_NAMES.ACCESS, accessToken, {
    ...baseOptions,
    path: '/',
    maxAge: TokenService.getAccessTokenMaxAgeMs(),
  });

  res.cookie(AUTH_COOKIE_NAMES.REFRESH, refreshToken, {
    ...baseOptions,
    path: '/api/v1/auth',
    maxAge: TokenService.getRefreshTokenMaxAgeMs(),
  });
}

export function clearAuthCookies(res: Response): void {
  const env = getEnv();
  if (!env.AUTH_USE_HTTP_ONLY_COOKIES) {
    return;
  }

  const baseOptions = getBaseCookieOptions();

  res.clearCookie(AUTH_COOKIE_NAMES.ACCESS, { ...baseOptions, path: '/' });
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH, { ...baseOptions, path: '/api/v1/auth' });
}

export function extractRefreshToken(
  bodyToken: string | undefined,
  cookieToken: string | undefined,
): string | undefined {
  return bodyToken ?? cookieToken;
}
