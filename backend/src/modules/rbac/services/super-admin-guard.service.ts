import {
  EmployeeRoleRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import type { RoleDocument } from '@domain/permission/permission.schemas.js';
import { PROTECTED_SYSTEM_ROLES, SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ConflictError, ForbiddenError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const SuperAdminGuardService = {
  isProtectedRole(role: Pick<RoleDocument, 'slug' | 'isSystem'>): boolean {
    return PROTECTED_SYSTEM_ROLES.includes(role.slug as typeof SYSTEM_ROLE_SLUG.SUPER_ADMIN);
  },

  assertRoleCanBeDeleted(role: RoleDocument): void {
    if (this.isProtectedRole(role)) {
      throw new ForbiddenError('Super Admin role cannot be deleted');
    }
  },

  assertRoleCanBeDisabled(role: RoleDocument, updates: { status?: string; isArchived?: boolean }): void {
    if (!this.isProtectedRole(role)) {
      return;
    }
    if (updates.status === ENTITY_STATUS.INACTIVE || updates.isArchived === true) {
      throw new ForbiddenError('Super Admin role cannot be disabled or archived');
    }
  },

  assertPermissionsCanBeModified(role: RoleDocument): void {
    if (this.isProtectedRole(role)) {
      throw new ForbiddenError('Super Admin role permissions cannot be modified');
    }
  },

  assertRoleCanBeUnassigned(role: RoleDocument, companyId: string, employeeId: string): void {
    if (!this.isProtectedRole(role)) {
      return;
    }
    // Caller must await assertLastSuperAdminProtected separately before revoke
    void companyId;
    void employeeId;
  },

  async assertLastSuperAdminProtected(companyId: string, employeeId: string, roleId: string): Promise<void> {
    const superAdminRole = await RoleRepository.findOne({ slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN }, { companyId });
    if (!superAdminRole || superAdminRole.id !== roleId) {
      return;
    }

    const allSuperAdminAssignments = await EmployeeRoleRepository.findMany(
      { roleId: superAdminRole.id, effectiveTo: null },
      { companyId },
    );

    const otherAssignments = allSuperAdminAssignments.filter((a) => a.employeeId !== employeeId);
    if (otherAssignments.length === 0 && allSuperAdminAssignments.some((a) => a.employeeId === employeeId)) {
      throw new ConflictError(
        'Cannot remove the last Super Admin assignment',
        ERROR_CODES.CONFLICT,
        { roleId: superAdminRole.id },
      );
    }
  },

  async assertRoleNotInUse(roleId: string, companyId: string): Promise<void> {
    const inUse = await EmployeeRoleRepository.exists({ roleId, effectiveTo: null }, { companyId });
    if (inUse) {
      throw new ConflictError('Role is assigned to employees and cannot be deleted', ERROR_CODES.CONFLICT, { roleId });
    }
  },

  async assertNoPermissionChangesForSuperAdmin(roleId: string, companyId: string): Promise<void> {
    const role = await RoleRepository.findById(roleId, { companyId });
    if (role && this.isProtectedRole(role)) {
      throw new ForbiddenError('Cannot modify permissions for Super Admin role');
    }
  },
};
