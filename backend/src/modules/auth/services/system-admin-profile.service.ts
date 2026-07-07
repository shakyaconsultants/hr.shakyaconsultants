import { UserModel, type UserDocument } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { BOOTSTRAP_ORG_DEFAULTS } from '@modules/auth/constants/role-seed.constants.js';
import { EmployeePurgeService } from '@modules/employee/services/employee-purge.service.js';
import { logger } from '@logging/winston.logger.js';

const SYSTEM_ACTOR = 'system';
const LEGACY_ADMIN_EMPLOYEE_NUMBER = BOOTSTRAP_ORG_DEFAULTS.EMPLOYEE_NUMBER;

/**
 * System administrator is a company user account — not an HR employee record.
 * Legacy bootstrap linked admin to an employee; this migrates existing installs.
 */
export const SystemAdminProfileService = {
  async resolveSuperAdminRoleId(companyId: string): Promise<string | null> {
    const role = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN, status: ENTITY_STATUS.ACTIVE, isArchived: false },
      { companyId },
    );
    return role?.id ?? null;
  },

  async isLegacyEmployeeLinkedAdmin(companyId: string, user: UserDocument): Promise<boolean> {
    if (!user.employeeId) {
      return false;
    }

    const superAdminRoleId = await this.resolveSuperAdminRoleId(companyId);
    if (!superAdminRoleId) {
      return false;
    }

    const assignment = await EmployeeRoleRepository.findOne(
      { employeeId: user.employeeId, roleId: superAdminRoleId, effectiveTo: null },
      { companyId },
    );

    return Boolean(assignment);
  },

  async migrateLegacyEmployeeLinkedAdmin(
    companyId: string,
    user: UserDocument,
  ): Promise<UserDocument> {
    const superAdminRoleId = await this.resolveSuperAdminRoleId(companyId);
    if (!superAdminRoleId) {
      return user;
    }

    const roleIds = user.roleIds.length ? user.roleIds : [superAdminRoleId];

    if (!user.employeeId) {
      if (!user.roleIds.includes(superAdminRoleId)) {
        await UserModel.updateOne(
          { id: user.id, companyId },
          { $set: { roleIds, updatedBy: SYSTEM_ACTOR, updatedAt: new Date() } },
        ).exec();
        return (await UserModel.findOne({ id: user.id, companyId }).exec()) ?? user;
      }
      return user;
    }

    const employeeId = user.employeeId;
    const employee = await EmployeeRepository.findById(employeeId, { companyId });

    await UserModel.updateOne(
      { id: user.id, companyId },
      {
        $set: { roleIds, updatedBy: SYSTEM_ACTOR, updatedAt: new Date() },
        $unset: { employeeId: '' },
      },
    ).exec();

    const assignments = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );
    for (const assignment of assignments) {
      await EmployeeRoleRepository.update(
        assignment.id,
        { $set: { effectiveTo: new Date(), updatedBy: SYSTEM_ACTOR } },
        { companyId },
      );
    }

    if (employee) {
      await EmployeePurgeService.hardDelete({ companyId, userId: SYSTEM_ACTOR }, employeeId);
      logger.info('Removed legacy admin employee row from database', {
        companyId,
        employeeId,
      });
    }

    logger.info('Migrated legacy admin from employee profile to system user profile', {
      companyId,
      userId: user.id,
      previousEmployeeId: employeeId,
      previousEmployeeNumber: employee?.employeeNumber ?? LEGACY_ADMIN_EMPLOYEE_NUMBER,
    });

    return (await UserModel.findOne({ id: user.id, companyId }).exec()) ?? user;
  },
};
