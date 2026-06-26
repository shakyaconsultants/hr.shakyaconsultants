import { EmployeeRepository, ReportingHierarchyRepository } from '@domain/employee/employee.schemas.js';
import { REPORTING_RELATIONSHIP_TYPE } from '@domain/employee/employee.schemas.js';
import { DepartmentRepository, BranchRepository } from '@domain/organization/organization.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import type { WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

function toEmployeeSummary(employee: { id: string; firstName: string; lastName: string; email: string; photoUrl?: string; designationId?: string; departmentId: string; jobTitle?: string }) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    photoUrl: employee.photoUrl,
    designationId: employee.designationId,
    departmentId: employee.departmentId,
    jobTitle: employee.jobTitle,
  };
}

export const WorkspaceHierarchyService = {
  async getOrgChart(context: WorkspaceActorContext) {
    const employee = await EmployeeRepository.findById(context.employeeId, { companyId: context.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const [department, branch, reportingEntries] = await Promise.all([
      DepartmentRepository.findById(employee.departmentId, { companyId: context.companyId }),
      employee.branchId ? BranchRepository.findById(employee.branchId, { companyId: context.companyId }) : Promise.resolve(null),
      ReportingHierarchyRepository.findMany(
        {
          employeeId: context.employeeId,
          $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
        },
        { companyId: context.companyId },
      ),
    ]);

    const managerIds = reportingEntries
      .filter((e) => e.relationshipType === REPORTING_RELATIONSHIP_TYPE.DIRECT)
      .map((e) => e.managerId);

    const primaryManagerId = reportingEntries.find((e) => e.isPrimary)?.managerId ?? managerIds[0];

    const [managers, directReports, peers] = await Promise.all([
      managerIds.length > 0
        ? EmployeeRepository.findMany({ id: { $in: managerIds } }, { companyId: context.companyId })
        : Promise.resolve([]),
      ReportingHierarchyRepository.findMany(
        {
          managerId: context.employeeId,
          relationshipType: REPORTING_RELATIONSHIP_TYPE.DIRECT,
          $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
        },
        { companyId: context.companyId },
      ).then(async (entries) => {
        const ids = entries.map((e) => e.employeeId);
        if (ids.length === 0) {
          return [];
        }
        return EmployeeRepository.findMany({ id: { $in: ids } }, { companyId: context.companyId });
      }),
      primaryManagerId
        ? ReportingHierarchyRepository.findMany(
            {
              managerId: primaryManagerId,
              relationshipType: REPORTING_RELATIONSHIP_TYPE.DIRECT,
              employeeId: { $ne: context.employeeId },
              $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
            },
            { companyId: context.companyId },
          ).then(async (entries) => {
            const ids = entries.map((e) => e.employeeId);
            if (ids.length === 0) {
              return [];
            }
            return EmployeeRepository.findMany({ id: { $in: ids } }, { companyId: context.companyId });
          })
        : Promise.resolve([]),
    ]);

    return {
      self: toEmployeeSummary(employee),
      department: department ? WorkspaceAuditService.toRecord(department) : null,
      branch: branch ? WorkspaceAuditService.toRecord(branch) : null,
      managers: managers.map(toEmployeeSummary),
      directReports: directReports.map(toEmployeeSummary),
      peers: peers.map(toEmployeeSummary),
      reportingEntries: reportingEntries.map(WorkspaceAuditService.toRecord),
    };
  },
};
