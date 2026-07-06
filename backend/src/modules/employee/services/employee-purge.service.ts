import { UserRepository } from '@domain/auth/user.schema.js';
import {
  AssetRepository,
  BankDetailsRepository,
  EducationRepository,
  EmergencyContactRepository,
  EmployeeDocumentFileRepository,
  EmployeeRepository,
  ExperienceRepository,
  ReportingHierarchyRepository,
} from '@domain/employee/employee.schemas.js';
import {
  EmployeeCertificationRepository,
  EmployeeSkillRepository,
  EmployeeTimelineRepository,
} from '@domain/employee/employee-subresource.schemas.js';
import { EmployeeRoleRepository } from '@domain/permission/permission.schemas.js';
import {
  DepartmentRepository,
  BranchRepository,
} from '@domain/organization/organization.schemas.js';
import { OnboardingRepository } from '@domain/recruitment/recruitment.schemas.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';

async function isSystemUserAccount(companyId: string, userId: string): Promise<boolean> {
  const user = await UserRepository.findById(userId, { companyId });
  if (!user) {
    return false;
  }
  if (user.roleIds.length > 0) {
    const superAdminRole = await RoleRepository.findOne(
      { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
      { companyId },
    );
    if (superAdminRole && user.roleIds.includes(superAdminRole.id)) {
      return true;
    }
  }
  return false;
}

export const EmployeePurgeService = {
  async purgeRelatedRecords(companyId: string, employeeId: string): Promise<void> {
    await Promise.all([
      EmergencyContactRepository.deleteMany({ employeeId }, { companyId }),
      BankDetailsRepository.deleteMany({ employeeId }, { companyId }),
      EducationRepository.deleteMany({ employeeId }, { companyId }),
      ExperienceRepository.deleteMany({ employeeId }, { companyId }),
      EmployeeDocumentFileRepository.deleteMany({ employeeId }, { companyId }),
      EmployeeSkillRepository.deleteMany({ employeeId }, { companyId }),
      EmployeeCertificationRepository.deleteMany({ employeeId }, { companyId }),
      AssetRepository.deleteMany({ employeeId }, { companyId }),
      EmployeeTimelineRepository.deleteMany({ employeeId }, { companyId }),
      OnboardingRepository.deleteMany({ employeeId }, { companyId }),
      EmployeeRoleRepository.deleteMany({ employeeId }, { companyId }),
      ReportingHierarchyRepository.deleteMany(
        { $or: [{ employeeId }, { managerId: employeeId }] },
        { companyId },
      ),
    ]);

    const departments = await DepartmentRepository.findMany(
      { headEmployeeId: employeeId },
      { companyId },
    );
    for (const department of departments) {
      await DepartmentRepository.update(
        department.id,
        { $unset: { headEmployeeId: '' }, updatedBy: 'system' },
        { companyId },
      );
    }

    const branches = await BranchRepository.findMany(
      { branchManagerId: employeeId },
      { companyId },
    );
    for (const branch of branches) {
      await BranchRepository.update(
        branch.id,
        { $unset: { branchManagerId: '' }, updatedBy: 'system' },
        { companyId },
      );
    }

    const subordinates = await EmployeeRepository.findMany(
      { reportingManagerId: employeeId },
      { companyId, includeDeleted: true },
    );
    for (const subordinate of subordinates) {
      await EmployeeRepository.update(
        subordinate.id,
        { $unset: { reportingManagerId: '' }, updatedBy: 'system' },
        { companyId, includeDeleted: true },
      );
    }
  },

  async hardDelete(context: EmployeeActorContext, employeeId: string): Promise<void> {
    const employee = await EmployeeRepository.findById(employeeId, {
      companyId: context.companyId,
      includeDeleted: true,
    });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (employee.userId) {
      const systemUser = await isSystemUserAccount(context.companyId, employee.userId);
      if (systemUser) {
        await UserRepository.update(
          employee.userId,
          { $unset: { employeeId: '' }, updatedBy: context.userId },
          { companyId: context.companyId },
        );
      } else {
        await UserRepository.hardDelete(employee.userId, { companyId: context.companyId });
      }
    }

    await this.purgeRelatedRecords(context.companyId, employeeId);

    const removed = await EmployeeRepository.hardDelete(employeeId, {
      companyId: context.companyId,
    });
    if (!removed) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }
  },
};
