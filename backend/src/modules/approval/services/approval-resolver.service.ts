import { EmployeeRepository, ReportingHierarchyRepository } from '@domain/employee/employee.schemas.js';
import { REPORTING_RELATIONSHIP_TYPE } from '@domain/employee/employee.schemas.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import type { ApprovalWorkflowStageDefinition } from '@domain/approval/approval.schemas.js';
import { APPROVER_TYPE } from '@domain/approval/approval.schemas.js';

export interface ResolvedApprover {
  employeeId: string;
  userId?: string;
}

export const ApprovalResolverService = {
  async resolveForStage(
    companyId: string,
    stage: ApprovalWorkflowStageDefinition,
    requesterEmployeeId: string,
  ): Promise<ResolvedApprover[]> {
    switch (stage.approverType) {
      case APPROVER_TYPE.MANAGER:
        return this.resolveManagers(companyId, requesterEmployeeId);
      case APPROVER_TYPE.ROLE:
        return stage.approverRoleSlug
          ? this.resolveByRole(companyId, stage.approverRoleSlug)
          : [];
      case APPROVER_TYPE.EMPLOYEE:
        return stage.approverEmployeeId
          ? this.resolveEmployee(companyId, stage.approverEmployeeId)
          : [];
      case APPROVER_TYPE.HIERARCHY_LEVEL:
        return stage.hierarchyLevelSlug
          ? this.resolveByRole(companyId, stage.hierarchyLevelSlug)
          : [];
      default:
        return [];
    }
  },

  async resolveManagers(companyId: string, employeeId: string): Promise<ResolvedApprover[]> {
    const entries = await ReportingHierarchyRepository.findMany(
      {
        employeeId,
        relationshipType: REPORTING_RELATIONSHIP_TYPE.DIRECT,
        $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
      },
      { companyId },
    );

    const managerIds = entries.map((e) => e.managerId);
    if (managerIds.length === 0) {
      return [];
    }

    const managers = await EmployeeRepository.findMany({ id: { $in: managerIds } }, { companyId });
    return managers.map((m) => ({ employeeId: m.id, userId: m.userId }));
  },

  async resolveByRole(companyId: string, roleSlug: string): Promise<ResolvedApprover[]> {
    const role = await RoleRepository.findOne({ slug: roleSlug, status: ENTITY_STATUS.ACTIVE }, { companyId });
    if (!role) {
      return [];
    }

    const assignments = await EmployeeRoleRepository.findMany(
      { roleId: role.id, effectiveTo: null },
      { companyId },
    );

    const employeeIds = assignments.map((a) => a.employeeId);
    if (employeeIds.length === 0) {
      return [];
    }

    const employees = await EmployeeRepository.findMany({ id: { $in: employeeIds } }, { companyId });
    return employees.map((e) => ({ employeeId: e.id, userId: e.userId }));
  },

  async resolveEmployee(companyId: string, employeeId: string): Promise<ResolvedApprover[]> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId });
    if (!employee) {
      return [];
    }
    return [{ employeeId: employee.id, userId: employee.userId }];
  },
};
