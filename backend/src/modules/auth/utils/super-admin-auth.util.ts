import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ENTERPRISE_PERMISSION_CATALOG } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

const ALL_PERMISSION_CODES = ENTERPRISE_PERMISSION_CATALOG.map((permission) => permission.code);

/** Admin bypass requires an active EmployeeRole assignment — not stale JWT roleIds alone. */
export async function isSuperAdminRequest(req: AuthenticatedRequest): Promise<boolean> {
  if (req.auth?.isSuperAdmin !== undefined) {
    return req.auth.isSuperAdmin;
  }

  const employeeId = req.user.employeeId;
  if (!employeeId) {
    req.auth = { ...req.auth, isSuperAdmin: false };
    return false;
  }

  const assignments = await EmployeeRoleRepository.findMany(
    { employeeId, effectiveTo: null },
    { companyId: req.user.companyId },
  );

  if (assignments.length === 0) {
    req.auth = { ...req.auth, isSuperAdmin: false };
    return false;
  }

  const roleIds = assignments.map((entry) => entry.roleId);
  const role = await RoleRepository.findOne({
    id: { $in: roleIds },
    slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN,
    status: ENTITY_STATUS.ACTIVE,
    isArchived: false,
  });
  const isSuperAdmin = Boolean(role);

  req.auth = {
    ...req.auth,
    isSuperAdmin,
    ...(isSuperAdmin ? { permissions: ALL_PERMISSION_CODES } : {}),
  };

  return isSuperAdmin;
}
