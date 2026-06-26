import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export function requireEmployeeContext(): RequestHandler {
  return (req, _res, next): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user.employeeId) {
      next(new ValidationError('Employee profile must be linked to access workspace', undefined, { code: ERROR_CODES.AUTH_FORBIDDEN }));
      return;
    }
    next();
  };
}
