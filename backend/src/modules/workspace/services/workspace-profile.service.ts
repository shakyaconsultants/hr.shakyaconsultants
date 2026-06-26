import { DeviceSessionModel } from '@domain/audit/audit.schemas.js';
import { EmployeeDashboardService } from '@modules/employee/services/employee-profile.service.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import { WorkspaceActivityService } from '@modules/workspace/services/workspace-activity.service.js';
import type { WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceProfileService = {
  async getProfile(context: WorkspaceActorContext) {
    const dashboard = await EmployeeDashboardService.getDashboard(context.companyId, context.employeeId);
    const permissions = await EffectivePermissionService.calculateForEmployee(context.companyId, context.employeeId);
    const sessions = await DeviceSessionModel.find({
      companyId: context.companyId,
      userId: context.userId,
      isRevoked: false,
    })
      .sort({ lastActiveAt: -1 })
      .limit(20)
      .lean();

    return {
      ...dashboard,
      permissions: permissions.permissions,
      roleIds: permissions.roleIds,
      sessions: sessions.map(WorkspaceAuditService.toRecord),
    };
  },

  async updateProfile(
    context: WorkspaceActorContext,
    payload: Record<string, unknown>,
  ) {
    const before = await EmployeeService.getById(context.companyId, context.employeeId);
    const allowedFields = ['phone', 'personalEmail', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'bio'];
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in payload) {
        update[field] = payload[field];
      }
    }

    const updated = await EmployeeService.update(context, context.employeeId, update);

    await WorkspaceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_profile',
      entityId: context.employeeId,
      action: 'update',
      before: WorkspaceAuditService.toRecord(before),
      after: WorkspaceAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await WorkspaceActivityService.publish(context, {
      activityType: WorkspaceActivityService.TYPES.PROFILE_UPDATED,
      description: 'Employee profile updated',
      entityType: 'employee',
      entityId: context.employeeId,
    });

    return WorkspaceAuditService.toRecord(updated);
  },
};
