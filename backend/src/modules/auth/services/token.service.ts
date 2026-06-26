import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { getEnv } from '@config/env.js';
import { AUTH_TOKEN_TYPE } from '@modules/auth/constants/auth.constants.js';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@modules/auth/interfaces/jwt-payload.interface.js';
import { AuthenticationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export function getJwtConfig() {
  const env = getEnv();
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  };
}

export function parseExpiresInToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
  if (!match) {
    return 900000;
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 900000;
  }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const TokenService = {
  signAccessToken(params: {
    userId: string;
    companyId: string;
    sessionId: string;
    tokenVersion: number;
    roleIds: string[];
    jti: string;
  }): string {
    const config = getJwtConfig();
    const payload: Omit<AccessTokenPayload, 'iss' | 'aud'> = {
      sub: params.userId,
      jti: params.jti,
      companyId: params.companyId,
      sessionId: params.sessionId,
      tokenVersion: params.tokenVersion,
      roleIds: params.roleIds,
      type: AUTH_TOKEN_TYPE.ACCESS,
    };

    return jwt.sign(payload, config.accessSecret, {
      expiresIn: config.accessExpiresIn,
      issuer: config.issuer,
      audience: config.audience,
    } as SignOptions);
  },

  signRefreshToken(params: {
    userId: string;
    companyId: string;
    sessionId: string;
    tokenVersion: number;
    jti: string;
  }): string {
    const config = getJwtConfig();
    const payload: Omit<RefreshTokenPayload, 'iss' | 'aud'> = {
      sub: params.userId,
      jti: params.jti,
      companyId: params.companyId,
      sessionId: params.sessionId,
      tokenVersion: params.tokenVersion,
      type: AUTH_TOKEN_TYPE.REFRESH,
    };

    return jwt.sign(payload, config.refreshSecret, {
      expiresIn: config.refreshExpiresIn,
      issuer: config.issuer,
      audience: config.audience,
    } as SignOptions);
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    const config = getJwtConfig();
    try {
      const decoded = jwt.verify(token, config.accessSecret, {
        issuer: config.issuer,
        audience: config.audience,
      }) as AccessTokenPayload;

      if (decoded.type !== AUTH_TOKEN_TYPE.ACCESS) {
        throw new AuthenticationError('Invalid access token', ERROR_CODES.AUTH_TOKEN_INVALID);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Access token expired', ERROR_CODES.AUTH_TOKEN_EXPIRED);
      }
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid access token', ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  },

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const config = getJwtConfig();
    try {
      const decoded = jwt.verify(token, config.refreshSecret, {
        issuer: config.issuer,
        audience: config.audience,
      }) as RefreshTokenPayload;

      if (decoded.type !== AUTH_TOKEN_TYPE.REFRESH) {
        throw new AuthenticationError('Invalid refresh token', ERROR_CODES.AUTH_TOKEN_INVALID);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token expired', ERROR_CODES.AUTH_TOKEN_EXPIRED);
      }
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid refresh token', ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  },

  getAccessTokenMaxAgeMs(): number {
    return parseExpiresInToMs(getJwtConfig().accessExpiresIn);
  },

  getRefreshTokenMaxAgeMs(): number {
    return parseExpiresInToMs(getJwtConfig().refreshExpiresIn);
  },
};

export const signAccessToken = TokenService.signAccessToken.bind(TokenService);
export const signRefreshToken = TokenService.signRefreshToken.bind(TokenService);
export const verifyAccessToken = TokenService.verifyAccessToken.bind(TokenService);
export const verifyRefreshToken = TokenService.verifyRefreshToken.bind(TokenService);
