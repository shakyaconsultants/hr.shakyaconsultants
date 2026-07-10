import type { Request, RequestHandler } from 'express';
import { ApiKeyService } from '@modules/integration/services/api-key.service.js';
import { AuthenticationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export interface ApiKeyAuthContext {
  companyId: string;
  userId: string;
  apiKeyId: string;
}

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKeyAuth?: ApiKeyAuthContext;
}

export const apiKeyAuthMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const plainKey = req.get('x-api-key')?.trim();
    if (!plainKey) {
      throw new AuthenticationError('API key required', ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    const doc = await ApiKeyService.resolveByPlainKey(plainKey, req.ip);
    if (!doc) {
      throw new AuthenticationError('Invalid API key', ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    (req as ApiKeyAuthenticatedRequest).apiKeyAuth = {
      companyId: doc.companyId,
      userId: doc.createdBy,
      apiKeyId: doc.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};
