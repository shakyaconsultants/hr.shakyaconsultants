import { CompanyRepository } from '@domain/company/company.schema.js';
import { UserRepository } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import {
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { BOOTSTRAP_ORG_DEFAULTS } from '@modules/auth/constants/role-seed.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { EmployeePurgeService } from '@modules/employee/services/employee-purge.service.js';
import { logger } from '@logging/winston.logger.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';

const SYSTEM_ACTOR = 'system';

/**
 * Legacy system-admin rows that must never live in the workforce `employees` collection.
 * Super admin = `users` only (enterprise portal). All other admins are normal employees.
 */
export const SystemGarbageService = {
  async findPurgeableLegacySystemEmployeeIds(companyId: string): Promise<string[]> {
    const ids = new Set<string>();

    const sysMarked = await EmployeeRepository.findMany(
      {
        $or: [
          { employeeNumber: { $regex: '^__SYS__' } },
          { employeeNumber: BOOTSTRAP_ORG_DEFAULTS.EMPLOYEE_NUMBER },
        ],
      },
      { companyId, includeDeleted: true },
    );
    for (const employee of sysMarked) {
      ids.add(employee.id);
    }

    const superAdminRole = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
      { companyId },
    );
    if (superAdminRole) {
      const legacyAssignments = await EmployeeRoleRepository.findMany(
        { roleId: superAdminRole.id },
        { companyId },
      );
      for (const assignment of legacyAssignments) {
        ids.add(assignment.employeeId);
      }

      const linkedUsers = await UserRepository.findMany(
        { roleIds: superAdminRole.id },
        { companyId },
      );
      for (const user of linkedUsers) {
        if (user.employeeId) {
          ids.add(user.employeeId);
        }
      }
    }

    const [adminDept, sysDesignation] = await Promise.all([
      DepartmentRepository.findOne({ code: BOOTSTRAP_ORG_DEFAULTS.DEPARTMENT_CODE }, { companyId }),
      DesignationRepository.findOne(
        { code: BOOTSTRAP_ORG_DEFAULTS.DESIGNATION_CODE },
        { companyId },
      ),
    ]);

    if (adminDept && sysDesignation) {
      const bootstrapRows = await EmployeeRepository.findMany(
        {
          departmentId: adminDept.id,
          designationId: sysDesignation.id,
          employeeNumber: BOOTSTRAP_ORG_DEFAULTS.EMPLOYEE_NUMBER,
        },
        { companyId, includeDeleted: true },
      );
      for (const employee of bootstrapRows) {
        ids.add(employee.id);
      }
    }

    return [...ids];
  },

  async purgeLegacySystemEmployees(companyId: string, actorUserId: string): Promise<number> {
    const employeeIds = await this.findPurgeableLegacySystemEmployeeIds(companyId);
    if (employeeIds.length === 0) {
      return 0;
    }

    const context: EmployeeActorContext = {
      companyId,
      userId: actorUserId,
    };

    let purged = 0;
    for (const employeeId of employeeIds) {
      const employee = await EmployeeRepository.findById(employeeId, {
        companyId,
        includeDeleted: true,
      });
      if (!employee) {
        continue;
      }

      try {
        await EmployeePurgeService.hardDelete(context, employeeId);
        purged += 1;
        logger.info('Purged legacy system employee record', { companyId, employeeId });
      } catch (error) {
        logger.warn('Failed to purge legacy system employee record', {
          companyId,
          employeeId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return purged;
  },

  async purgeAllCompanies(): Promise<{ companies: number; purged: number }> {
    const companies = await CompanyRepository.findMany({}, {});
    let purged = 0;

    for (const company of companies) {
      purged += await this.purgeLegacySystemEmployees(company.id, SYSTEM_ACTOR);
    }

    return { companies: companies.length, purged };
  },
};
