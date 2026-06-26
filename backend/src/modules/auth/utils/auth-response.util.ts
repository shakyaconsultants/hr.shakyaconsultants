import type { LoginResponse, RefreshResponse } from '@modules/auth/dto/auth.dto.js';
import { getEnv } from '@config/env.js';

export function sanitizeAuthLoginResponse(response: LoginResponse): LoginResponse {
  const env = getEnv();
  if (!env.AUTH_USE_HTTP_ONLY_COOKIES) {
    return response;
  }

  return {
    user: response.user,
    sessionId: response.sessionId,
    tokens: {
      accessToken: '',
      refreshToken: '',
      expiresIn: response.tokens.expiresIn,
      tokenType: response.tokens.tokenType,
    },
  };
}

export function sanitizeAuthRefreshResponse(response: RefreshResponse): RefreshResponse {
  const env = getEnv();
  if (!env.AUTH_USE_HTTP_ONLY_COOKIES) {
    return response;
  }

  return {
    sessionId: response.sessionId,
    tokens: {
      accessToken: '',
      refreshToken: '',
      expiresIn: response.tokens.expiresIn,
      tokenType: response.tokens.tokenType,
    },
  };
}
