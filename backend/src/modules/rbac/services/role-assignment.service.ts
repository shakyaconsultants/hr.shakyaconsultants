import {
  EmployeeRoleRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import { MongoServerError } from 'mongodb';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { RbacAuditService } from '@modules/rbac/services/rbac-audit.service.js';
import { SuperAdminGuardService } from '@modules/rbac/services/super-admin-guard.service.js';
import { PermissionCacheService } from '@modules/rbac/services/permission-cache.service.js';
import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';

export const RoleAssignmentService = {
  async assignRoleToEmployee(
    companyId: string,
    employeeId: string,
    roleId: string,
    actor: RbacActorContext,
    options?: { isPrimary?: boolean },
  ): Promise<void> {
    const role = await RoleRepository.findById(roleId, { companyId });
    if (!role) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }

    const existing = await EmployeeRoleRepository.findOne({ employeeId, roleId }, { companyId });

    if (existing) {
      const isActive = existing.effectiveTo === null || existing.effectiveTo === undefined;
      if (isActive) {
        return;
      }

      await EmployeeRoleRepository.update(
        existing.id,
        {
          $set: {
            effectiveTo: null,
            effectiveFrom: new Date(),
            assignedBy: actor.userId,
            assignedAt: new Date(),
            isPrimary: options?.isPrimary ?? existing.isPrimary,
            updatedBy: actor.userId,
          },
        },
        { companyId },
      );

      await PermissionCacheService.invalidate(companyId, employeeId);
      await RbacAuditService.log({
        companyId,
        userId: actor.userId,
        entityType: 'employee_role',
        entityId: employeeId,
        action: 'assign',
        after: { roleId, employeeId, reactivated: true },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
      return;
    }

    try {
      await EmployeeRoleRepository.create(
        {
          id: generateUuid(),
          companyId,
          employeeId,
          roleId,
          assignedBy: actor.userId,
          assignedAt: new Date(),
          isPrimary: options?.isPrimary ?? false,
          effectiveFrom: new Date(),
          effectiveTo: null,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        { companyId },
      );
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const active = await EmployeeRoleRepository.findOne(
          { employeeId, roleId, effectiveTo: null },
          { companyId },
        );
        if (active) {
          return;
        }
      }
      throw error;
    }

    await PermissionCacheService.invalidate(companyId, employeeId);
    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'employee_role',
      entityId: employeeId,
      action: 'assign',
      after: { roleId, employeeId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async revokeRoleFromEmployee(
    companyId: string,
    employeeId: string,
    roleId: string,
    actor: RbacActorContext,
  ): Promise<void> {
    const role = await RoleRepository.findById(roleId, { companyId });
    if (!role) {
      throw new NotFoundError('Role not found', ERROR_CODES.NOT_FOUND);
    }

    SuperAdminGuardService.assertRoleCanBeUnassigned(role, companyId, employeeId);
    await SuperAdminGuardService.assertLastSuperAdminProtected(companyId, employeeId, roleId);

    const assignment = await EmployeeRoleRepository.findOne(
      { employeeId, roleId, effectiveTo: null },
      { companyId },
    );
    if (!assignment) {
      throw new NotFoundError('Role assignment not found', ERROR_CODES.NOT_FOUND);
    }

    await EmployeeRoleRepository.update(
      assignment.id,
      { $set: { effectiveTo: new Date(), updatedBy: actor.userId } },
      { companyId },
    );

    await PermissionCacheService.invalidate(companyId, employeeId);
    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'employee_role',
      entityId: employeeId,
      action: 'revoke',
      before: { roleId, employeeId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async bulkAssignRoles(
    companyId: string,
    employeeId: string,
    roleIds: string[],
    actor: RbacActorContext,
  ): Promise<{ assigned: string[] }> {
    const assigned: string[] = [];
    for (const roleId of roleIds) {
      try {
        await this.assignRoleToEmployee(companyId, employeeId, roleId, actor);
        assigned.push(roleId);
      } catch (error) {
        if (error instanceof ConflictError) {
          continue;
        }
        throw error;
      }
    }
    return { assigned };
  },

  async bulkRevokeRoles(
    companyId: string,
    employeeId: string,
    roleIds: string[],
    actor: RbacActorContext,
  ): Promise<{ revoked: string[] }> {
    const revoked: string[] = [];
    for (const roleId of roleIds) {
      try {
        await this.revokeRoleFromEmployee(companyId, employeeId, roleId, actor);
        revoked.push(roleId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          continue;
        }
        throw error;
      }
    }
    return { revoked };
  },

  async getEmployeeRoles(companyId: string, employeeId: string) {
    const assignments = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );
    const roleIds = assignments.map((a) => a.roleId);
    const roles = await RoleRepository.findMany({ id: { $in: roleIds } }, { companyId });
    return { assignments, roles };
  },

  async getEffectivePermissions(companyId: string, employeeId: string) {
    return EffectivePermissionService.calculateForEmployee(companyId, employeeId);
  },

  async bulkAssignPermissionsToRole(
    companyId: string,
    roleId: string,
    permissionIds: string[],
    actor: RbacActorContext,
  ): Promise<{ assigned: number }> {
    await SuperAdminGuardService.assertNoPermissionChangesForSuperAdmin(roleId, companyId);

    const permissions = await PermissionRepository.findMany({ id: { $in: permissionIds } });
    let assigned = 0;

    for (const permission of permissions) {
      const exists = await RolePermissionRepository.findOne(
        { roleId, permissionId: permission.id },
        { companyId },
      );
      if (exists) {
        continue;
      }

      await RolePermissionRepository.create(
        {
          id: generateUuid(),
          companyId,
          roleId,
          permissionId: permission.id,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        { companyId },
      );
      assigned += 1;
    }

    const assignments = await EmployeeRoleRepository.findMany({ roleId, effectiveTo: null }, { companyId });
    await Promise.all(
      assignments.map((a) => PermissionCacheService.invalidate(companyId, a.employeeId)),
    );

    return { assigned };
  },
};
