import { UserRepository, USER_STATUS } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { WorkforceScopeService } from '@modules/employee/services/workforce-scope.service.js';
import { EmployeePurgeService } from '@modules/employee/services/employee-purge.service.js';
import { SystemGarbageService } from '@modules/system/services/system-garbage.service.js';
import { logger } from '@logging/winston.logger.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';

const SYSTEM_ACTOR = 'system';

function isSmokeTestEmail(email: string): boolean {
  return email.includes('smoke.employee.') || email.endsWith('@example.com');
}

async function isSuperAdminUser(companyId: string, userId: string): Promise<boolean> {
  const user = await UserRepository.findById(userId, { companyId });
  if (!user) {
    return false;
  }
  const superAdminRole = await RoleRepository.findOne(
    { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
    { companyId },
  );
  return Boolean(superAdminRole && user.roleIds.includes(superAdminRole.id) && !user.employeeId);
}

/**
 * Cleans workforce identity data only — never touches organization master data
 * (departments, designations, branches, holidays, settings, etc.).
 */
export const WorkforceCleanupService = {
  async reclaimGhostRecordsForEmail(
    companyId: string,
    email: string,
    actorUserId: string,
  ): Promise<number> {
    const normalizedEmail = email.toLowerCase();
    const matches = await EmployeeRepository.findMany(
      { email: normalizedEmail },
      { companyId, includeDeleted: true },
    );
    const systemOperatorIds = await WorkforceScopeService.getSystemOperatorEmployeeIds(companyId);

    const context: EmployeeActorContext = { companyId, userId: actorUserId };
    let purged = 0;

    for (const employee of matches) {
      const isLegacySystemOperator = systemOperatorIds.has(employee.id);
      const isActiveWorkforce = employee.status === ENTITY_STATUS.ACTIVE && !employee.isDeleted;
      if (isActiveWorkforce && !isLegacySystemOperator) {
        continue;
      }

      try {
        await EmployeePurgeService.hardDelete(context, employee.id);
        purged += 1;
      } catch (error) {
        logger.warn('Failed to purge ghost employee record during email reclaim', {
          companyId,
          employeeId: employee.id,
          email: normalizedEmail,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return purged;
  },

  async cleanupOrphanedPortalUsers(companyId: string, actorUserId: string): Promise<number> {
    const users = await UserRepository.findMany({}, { companyId });
    let cleaned = 0;

    for (const user of users) {
      if (await isSuperAdminUser(companyId, user.id)) {
        continue;
      }

      let linkedEmployee = null;
      if (user.employeeId) {
        linkedEmployee = await EmployeeRepository.findById(user.employeeId, {
          companyId,
          includeDeleted: true,
        });
      }

      const employeeMissing =
        Boolean(user.employeeId) &&
        (!linkedEmployee ||
          linkedEmployee.isDeleted ||
          linkedEmployee.status !== ENTITY_STATUS.ACTIVE);
      const isDisposableTestAccount =
        user.status !== USER_STATUS.ACTIVE || isSmokeTestEmail(user.email);

      if (employeeMissing && isDisposableTestAccount) {
        await UserRepository.hardDelete(user.id, { companyId });
        cleaned += 1;
        continue;
      }

      if (employeeMissing) {
        await UserRepository.update(
          user.id,
          { $unset: { employeeId: '' }, updatedBy: actorUserId },
          { companyId },
        );
        cleaned += 1;
      }
    }

    return cleaned;
  },

  async runWorkforceCleanup(
    companyId: string,
    actorUserId: string = SYSTEM_ACTOR,
  ): Promise<{
    legacySystemEmployeesPurged: number;
    orphanedUsersCleaned: number;
  }> {
    const legacySystemEmployeesPurged = await SystemGarbageService.purgeLegacySystemEmployees(
      companyId,
      actorUserId,
    );
    const orphanedUsersCleaned = await this.cleanupOrphanedPortalUsers(companyId, actorUserId);

    logger.info('Workforce cleanup completed (organization master data preserved)', {
      companyId,
      legacySystemEmployeesPurged,
      orphanedUsersCleaned,
    });

    return { legacySystemEmployeesPurged, orphanedUsersCleaned };
  },

  async runForAllCompanies(): Promise<{
    companies: number;
    legacySystemEmployeesPurged: number;
    orphanedUsersCleaned: number;
  }> {
    const { CompanyRepository } = await import('@domain/company/company.schema.js');
    const companies = await CompanyRepository.findMany({}, {});
    let legacySystemEmployeesPurged = 0;
    let orphanedUsersCleaned = 0;

    for (const company of companies) {
      const result = await this.runWorkforceCleanup(company.id, SYSTEM_ACTOR);
      legacySystemEmployeesPurged += result.legacySystemEmployeesPurged;
      orphanedUsersCleaned += result.orphanedUsersCleaned;
    }

    return {
      companies: companies.length,
      legacySystemEmployeesPurged,
      orphanedUsersCleaned,
    };
  },
};
