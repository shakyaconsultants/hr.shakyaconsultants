import type { Response, NextFunction, Request } from 'express';
import { AUTH_COOKIE_NAMES } from '@modules/auth/constants/auth.constants.js';
import { TokenService } from '@modules/auth/services/token.service.js';
import { AuthUserRepository } from '@modules/auth/repositories/user.repository.js';
import { USER_STATUS } from '@domain/auth/user.schema.js';
import { SessionService } from '@modules/auth/services/session.service.js';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import type { AuthenticatedUser } from '@modules/auth/interfaces/auth-user.interface.js';
import { AuthenticationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HEADERS } from '@shared/constants/http.constants.js';

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers[HEADERS.AUTHORIZATION];
  if (!header || typeof header !== 'string') {
    return undefined;
  }

  const [scheme, token] = header.split(' ');
  if (scheme.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }

  return token;
}

function extractAccessToken(req: Request): string | undefined {
  return extractBearerToken(req) ?? (req.cookies[AUTH_COOKIE_NAMES.ACCESS] as string | undefined);
}

export async function authenticateMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      throw new AuthenticationError('Authentication required', ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    const payload = TokenService.verifyAccessToken(token);

    const [user, session] = await Promise.all([
      AuthUserRepository.findById(payload.sub, payload.companyId),
      SessionService.findActiveSessionForAuth(payload.companyId, payload.sessionId),
    ]);

    if (!user) {
      throw new AuthenticationError('User not found', ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new AuthenticationError('Token revoked', ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    if (!session) {
      throw new AuthenticationError('Session revoked', ERROR_CODES.AUTH_SESSION_REVOKED);
    }

    if (user.status === USER_STATUS.INACTIVE || user.status === USER_STATUS.PENDING) {
      throw new AuthenticationError('Account is not active', ERROR_CODES.AUTH_ACCOUNT_INACTIVE);
    }

    if (user.status !== USER_STATUS.ACTIVE && user.status !== USER_STATUS.LOCKED) {
      throw new AuthenticationError('Account is disabled', ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: payload.sub,
      companyId: payload.companyId,
      sessionId: payload.sessionId,
      employeeId: user.employeeId,
      roleIds: payload.roleIds,
      tokenVersion: payload.tokenVersion,
      email: user.email,
    };

    const authReq = req as AuthenticatedRequest;
    authReq.user = authenticatedUser;
    authReq.authUserRecord = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuthenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = extractAccessToken(req);
  if (!token) {
    next();
    return;
  }

  void authenticateMiddleware(req, res, next);
}
