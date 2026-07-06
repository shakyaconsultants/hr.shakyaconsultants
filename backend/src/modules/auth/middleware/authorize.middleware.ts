import type { Response, NextFunction, RequestHandler } from 'express';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';
import {
  isAuthenticatedRequest,
  type AuthenticatedRequest,
} from '@modules/auth/interfaces/auth-request.interface.js';
import { isSuperAdminRequest } from '@modules/auth/utils/super-admin-auth.util.js';
import { ENTERPRISE_PERMISSION_CATALOG } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import { AuthorizationError, AuthenticationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

const ALL_PERMISSION_CODES = ENTERPRISE_PERMISSION_CATALOG.map((permission) => permission.code);

async function loadPermissions(req: AuthenticatedRequest): Promise<string[]> {
  if (Array.isArray(req.auth?.permissions)) {
    return req.auth.permissions;
  }

  if (!req.user.employeeId) {
    if (await isSuperAdminRequest(req)) {
      return ALL_PERMISSION_CODES;
    }
    if (req.user.roleIds.length > 0) {
      const permissions = await EffectivePermissionService.calculateForRoleIds(
        req.user.companyId,
        req.user.roleIds,
      );
      req.auth = { ...req.auth, permissions };
      return permissions;
    }
    return [];
  }

  const permissions = await PermissionEngineService.getPermissionsForUser(
    req.user.companyId,
    req.user.employeeId,
  );

  req.auth = { ...req.auth, permissions };
  return permissions;
}

function assertAuthenticated(req: AuthenticatedRequest): void {
  if (!isAuthenticatedRequest(req)) {
    throw new AuthenticationError('Authentication required', ERROR_CODES.AUTH_UNAUTHORIZED);
  }
}

export function authorize(permission: string): RequestHandler {
  return async (req, _res: Response, next: NextFunction) => {
    try {
      assertAuthenticated(req as AuthenticatedRequest);
      const authReq = req as AuthenticatedRequest;
      if (await isSuperAdminRequest(authReq)) {
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

export function authorizeAny(...requiredPermissions: string[]): RequestHandler {
  return async (req, _res: Response, next: NextFunction) => {
    try {
      assertAuthenticated(req as AuthenticatedRequest);
      const authReq = req as AuthenticatedRequest;
      if (await isSuperAdminRequest(authReq)) {
        next();
        return;
      }
      const permissions = await loadPermissions(authReq);

      const hasAny = requiredPermissions.some((permission) => permissions.includes(permission));
      if (!hasAny) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizeAll(...requiredPermissions: string[]): RequestHandler {
  return async (req, _res: Response, next: NextFunction) => {
    try {
      assertAuthenticated(req as AuthenticatedRequest);
      const authReq = req as AuthenticatedRequest;
      if (await isSuperAdminRequest(authReq)) {
        next();
        return;
      }
      const permissions = await loadPermissions(authReq);

      const hasAll = requiredPermissions.every((permission) => permissions.includes(permission));
      if (!hasAll) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
