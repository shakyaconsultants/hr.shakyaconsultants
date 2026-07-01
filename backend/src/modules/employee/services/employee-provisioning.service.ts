import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { RoleAssignmentService } from '@modules/rbac/services/role-assignment.service.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { logger } from '@logging/winston.logger.js';

export const EmployeeProvisioningService = {
  async ensureDefaultEmployeeRole(
    companyId: string,
    employeeId: string,
    actor: RbacActorContext,
  ): Promise<boolean> {
    const assignments = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );
    if (assignments.length > 0) {
      return false;
    }

    const role = await RoleRepository.findOne({ slug: SYSTEM_ROLE_SLUG.EMPLOYEE }, { companyId });
    if (!role) {
      logger.warn('Default employee role not found — user will have no portal access', {
        companyId,
        employeeId,
      });
      return false;
    }

    await RoleAssignmentService.assignRoleToEmployee(companyId, employeeId, role.id, actor, {
      isPrimary: true,
    });
    return true;
  },
};
