import { AuthUserRepository } from '@modules/auth/repositories/user.repository.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ENTERPRISE_PERMISSION_CATALOG } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

const ALL_PERMISSION_CODES = ENTERPRISE_PERMISSION_CATALOG.map((permission) => permission.code);

async function hasSuperAdminRole(companyId: string, roleIds: string[]): Promise<boolean> {
  if (roleIds.length === 0) {
    return false;
  }

  const role = await RoleRepository.findOne(
    {
      id: { $in: roleIds },
      slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN,
      status: ENTITY_STATUS.ACTIVE,
      isArchived: false,
    },
    { companyId },
  );

  return Boolean(role);
}

/** Admin bypass requires an active Super Admin role — not stale JWT roleIds alone. */
export async function isSuperAdminRequest(req: AuthenticatedRequest): Promise<boolean> {
  if (req.auth?.isSuperAdmin !== undefined) {
    return req.auth.isSuperAdmin;
  }

  if (await hasSuperAdminRole(req.user.companyId, req.user.roleIds)) {
    req.auth = {
      ...req.auth,
      isSuperAdmin: true,
      permissions: ALL_PERMISSION_CODES,
    };
    return true;
  }

  const employeeId = req.user.employeeId;
  if (employeeId) {
    const assignments = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId: req.user.companyId },
    );

    if (assignments.length > 0) {
      const roleIds = assignments.map((entry) => entry.roleId);
      const isSuperAdmin = await hasSuperAdminRole(req.user.companyId, roleIds);
      req.auth = {
        ...req.auth,
        isSuperAdmin,
        ...(isSuperAdmin ? { permissions: ALL_PERMISSION_CODES } : {}),
      };
      return isSuperAdmin;
    }
  }

  const dbUser = await AuthUserRepository.findById(req.user.userId, req.user.companyId);
  if (
    dbUser &&
    dbUser.roleIds.length > 0 &&
    (await hasSuperAdminRole(req.user.companyId, dbUser.roleIds))
  ) {
    req.auth = {
      ...req.auth,
      isSuperAdmin: true,
      permissions: ALL_PERMISSION_CODES,
    };
    return true;
  }

  req.auth = { ...req.auth, isSuperAdmin: false };
  return false;
}
