import type { Response, NextFunction, RequestHandler } from 'express';
import {
  isAuthenticatedRequest,
  type AuthenticatedRequest,
} from '@modules/auth/interfaces/auth-request.interface.js';
import { AuthorizationError, AuthenticationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

function extractCompanyId(req: AuthenticatedRequest): string | undefined {
  const paramCompanyId = req.params.companyId;
  if (typeof paramCompanyId === 'string' && paramCompanyId.length > 0) {
    return paramCompanyId;
  }

  const body = req.body as Record<string, unknown> | undefined;
  const bodyCompanyId = body?.companyId;
  if (typeof bodyCompanyId === 'string' && bodyCompanyId.length > 0) {
    return bodyCompanyId;
  }

  const queryCompanyId = req.query.companyId;
  if (typeof queryCompanyId === 'string' && queryCompanyId.length > 0) {
    return queryCompanyId;
  }

  return undefined;
}

export function companyScopeMiddleware(): RequestHandler {
  return (req, _res: Response, next: NextFunction) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        throw new AuthenticationError('Authentication required', ERROR_CODES.AUTH_UNAUTHORIZED);
      }

      const targetCompanyId = extractCompanyId(req);
      if (targetCompanyId && targetCompanyId !== req.user.companyId) {
        throw new AuthorizationError('Cross-company access denied');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
