import { RoleRepository } from '@domain/permission/permission.schemas.js';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ENTERPRISE_PERMISSION_CATALOG } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';

const ALL_PERMISSION_CODES = ENTERPRISE_PERMISSION_CATALOG.map((permission) => permission.code);

/** Super Admin bypass is role-based and applies after authentication only. */
export async function isSuperAdminRequest(req: AuthenticatedRequest): Promise<boolean> {
  if (req.auth?.isSuperAdmin !== undefined) {
    return req.auth.isSuperAdmin;
  }

  const roleIds = req.user.roleIds ?? [];
  if (roleIds.length === 0) {
    req.auth = { ...req.auth, isSuperAdmin: false };
    return false;
  }

  const role = await RoleRepository.findOne({
    id: { $in: roleIds },
    slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN,
  });
  const isSuperAdmin = Boolean(role);

  req.auth = {
    ...req.auth,
    isSuperAdmin,
    ...(isSuperAdmin ? { permissions: ALL_PERMISSION_CODES } : {}),
  };

  return isSuperAdmin;
}
