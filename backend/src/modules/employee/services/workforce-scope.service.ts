import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { UserRepository } from '@domain/auth/user.schema.js';
import {
  DesignationRepository,
  DepartmentRepository,
} from '@domain/organization/organization.schemas.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { BOOTSTRAP_ORG_DEFAULTS } from '@modules/auth/constants/role-seed.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { SystemGarbageService } from '@modules/system/services/system-garbage.service.js';

/**
 * System operators (seeded super admin) are user accounts — not workforce rows for org charts.
 */
export const WorkforceScopeService = {
  async getSystemOperatorEmployeeIds(companyId: string): Promise<Set<string>> {
    const excluded = new Set<string>();

    const superAdminRole = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
      { companyId },
    );

    if (superAdminRole) {
      const systemUsers = await UserRepository.findMany(
        { roleIds: superAdminRole.id },
        { companyId },
      );
      for (const user of systemUsers) {
        if (user.employeeId) {
          excluded.add(user.employeeId);
        }
      }

      const legacyRoleAssignments = await EmployeeRoleRepository.findMany(
        { roleId: superAdminRole.id, effectiveTo: null },
        { companyId },
      );
      for (const assignment of legacyRoleAssignments) {
        excluded.add(assignment.employeeId);
      }
    }

    const [adminDept, sysDesignation] = await Promise.all([
      DepartmentRepository.findOne({ code: BOOTSTRAP_ORG_DEFAULTS.DEPARTMENT_CODE }, { companyId }),
      DesignationRepository.findOne(
        { code: BOOTSTRAP_ORG_DEFAULTS.DESIGNATION_CODE },
        { companyId },
      ),
    ]);

    const legacyBootstrap = await EmployeeRepository.findMany(
      {
        status: { $ne: ENTITY_STATUS.ARCHIVED },
        $or: [
          { employeeNumber: { $regex: '^__SYS__' } },
          ...(adminDept && sysDesignation
            ? [{ departmentId: adminDept.id, designationId: sysDesignation.id }]
            : []),
        ],
      },
      { companyId },
    );

    for (const employee of legacyBootstrap) {
      excluded.add(employee.id);
    }

    return excluded;
  },

  async filterWorkforceEmployees(
    companyId: string,
    employees: EmployeeDocument[],
  ): Promise<EmployeeDocument[]> {
    const excluded = await this.getSystemOperatorEmployeeIds(companyId);
    if (excluded.size === 0) {
      return employees;
    }
    return employees.filter((employee) => !excluded.has(employee.id));
  },

  async purgeLegacySystemEmployees(companyId: string, actorUserId: string): Promise<number> {
    return SystemGarbageService.purgeLegacySystemEmployees(companyId, actorUserId);
  },
};
