import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { isSuperAdminRequest } from '@modules/auth/utils/super-admin-auth.util.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export function requireEmployeeContext(): RequestHandler {
  return async (req, _res, next): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (await isSuperAdminRequest(authReq)) {
        next();
        return;
      }
      if (!authReq.user.employeeId) {
        next(new ValidationError('Employee profile must be linked to access workspace', undefined, { code: ERROR_CODES.AUTH_FORBIDDEN }));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
