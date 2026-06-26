import type { Response, NextFunction, RequestHandler } from 'express';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import {
  isAuthenticatedRequest,
  type AuthenticatedRequest,
} from '@modules/auth/interfaces/auth-request.interface.js';
import { AuthorizationError, AuthenticationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

async function loadPermissions(req: AuthenticatedRequest): Promise<string[]> {
  if (req.auth?.permissions) {
    return req.auth.permissions;
  }

  if (!req.user.employeeId) {
    return [];
  }

  const permissions = await PermissionEngineService.getPermissionsForUser(
    req.user.companyId,
    req.user.employeeId,
  );

  req.auth = { permissions };
  return permissions;
}

function assertAuthenticated(req: AuthenticatedRequest): void {
  if (!isAuthenticatedRequest(req)) {
    throw new AuthenticationError('Authentication required', ERROR_CODES.AUTH_UNAUTHORIZED);
  }
}

export function authorizeOwnerOrPermission(
  permission: string,
  resolveOwnerId: (req: AuthenticatedRequest) => string | undefined,
): RequestHandler {
  return async (req, _res: Response, next: NextFunction) => {
    try {
      assertAuthenticated(req as AuthenticatedRequest);
      const authReq = req as AuthenticatedRequest;
      const ownerId = resolveOwnerId(authReq);

      if (ownerId && authReq.user.employeeId === ownerId) {
        next();
        return;
      }

      const permissions = await loadPermissions(authReq);
      if (!permissions.includes(permission)) {
        throw new AuthorizationError(`Missing permission: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export {
  authorize,
  authorizeAny,
  authorizeAll,
} from '@modules/auth/middleware/authorize.middleware.js';
