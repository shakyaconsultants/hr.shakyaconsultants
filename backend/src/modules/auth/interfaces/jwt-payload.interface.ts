import type { AuthTokenType } from '@modules/auth/constants/auth.constants.js';

export interface AccessTokenPayload {
  sub: string;
  jti: string;
  iss: string;
  aud: string;
  companyId: string;
  sessionId: string;
  tokenVersion: number;
  roleIds: string[];
  type: AuthTokenType;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  iss: string;
  aud: string;
  companyId: string;
  sessionId: string;
  tokenVersion: number;
  type: AuthTokenType;
}
