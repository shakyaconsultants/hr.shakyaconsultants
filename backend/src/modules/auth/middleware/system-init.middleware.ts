import type { Response, NextFunction, RequestHandler } from 'express';
import { getEnv } from '@config/env.js';
import { AUTH_ROUTES } from '@modules/auth/constants/auth.constants.js';
import { SystemInitService } from '@modules/auth/services/system-init.service.js';
import { AppError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http.constants.js';

function isSystemStatusRoute(path: string): boolean {
  const normalized = path.replace(/\/+$/, '');
  const statusPath = `${getEnv().API_PREFIX}${AUTH_ROUTES.BASE}${AUTH_ROUTES.SYSTEM_STATUS}`;
  return normalized === statusPath;
}

export function systemInitMiddleware(): RequestHandler {
  return async (req, _res: Response, next: NextFunction) => {
    try {
      if (isSystemStatusRoute(req.originalUrl.split('?')[0] ?? req.path)) {
        next();
        return;
      }

      const initialized = await SystemInitService.isSystemInitialized();
      if (!initialized) {
        throw new AppError({
          code: ERROR_CODES.SYSTEM_NOT_INITIALIZED,
          message: 'System is not initialized. Run `npm run seed` once from the backend workspace.',
          statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
