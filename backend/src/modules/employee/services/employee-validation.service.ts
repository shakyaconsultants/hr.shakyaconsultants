import {
  EmployeeRepository,
  ReportingHierarchyRepository,
} from '@domain/employee/employee.schemas.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import { UserRepository } from '@domain/auth/user.schema.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { ConflictError, NotFoundError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { WorkforceCleanupService } from '@modules/employee/services/workforce-cleanup.service.js';
import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';

export type EmailAvailabilityReason =
  | 'AVAILABLE'
  | 'DUPLICATE_EMAIL'
  | 'SYSTEM_ADMIN_EMAIL'
  | 'PORTAL_USER_LINKED';

export interface EmailAvailabilityResult {
  available: boolean;
  reason: EmailAvailabilityReason;
  message: string;
  employeeId?: string;
  employeeName?: string;
}

async function findSuperAdminRole(companyId: string) {
  return RoleRepository.findOne({ slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN }, { companyId });
}

function isSuperAdminPortalUser(
  user: { roleIds: string[]; employeeId?: string | null },
  superAdminRoleId: string | undefined,
): boolean {
  return Boolean(superAdminRoleId && user.roleIds.includes(superAdminRoleId) && !user.employeeId);
}

function employeeDisplayName(employee: {
  firstName: string;
  lastName: string;
  employeeNumber: string;
}): string {
  return `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeNumber;
}

function isActiveWorkforceEmployee(employee: { status: string; isDeleted: boolean }): boolean {
  return employee.status === ENTITY_STATUS.ACTIVE && !employee.isDeleted;
}

async function findActiveEmployeeByEmail(
  companyId: string,
  email: string,
  excludeEmployeeId?: string,
): Promise<EmployeeDocument | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
  const matches = await EmployeeRepository.findMany(
    { email: normalizedEmail },
    { companyId, includeDeleted: true },
  );
  return matches.find(
    (employee) => employee.id !== excludeEmployeeId && isActiveWorkforceEmployee(employee),
  );
}

async function findPortalUserConflict(
  companyId: string,
  normalizedEmail: string,
  excludeEmployeeId?: string,
): Promise<EmailAvailabilityResult | null> {
  const portalUser = await UserRepository.findOne({ email: normalizedEmail }, { companyId });
  if (!portalUser) {
    return null;
  }

  const superAdminRole = await findSuperAdminRole(companyId);
  if (isSuperAdminPortalUser(portalUser, superAdminRole?.id)) {
    return {
      available: false,
      reason: 'SYSTEM_ADMIN_EMAIL',
      message:
        'This email is reserved for the company administrator login. Use a different work email for the employee.',
    };
  }

  if (!portalUser.employeeId || portalUser.employeeId === excludeEmployeeId) {
    return {
      available: true,
      reason: 'AVAILABLE',
      message: 'Email is available. An existing portal account will be linked to this employee.',
    };
  }

  const linkedEmployee = await EmployeeRepository.findById(portalUser.employeeId, {
    companyId,
    includeDeleted: true,
  });
  if (!linkedEmployee || !isActiveWorkforceEmployee(linkedEmployee)) {
    return {
      available: true,
      reason: 'AVAILABLE',
      message: 'Email is available. An existing portal account will be linked to this employee.',
    };
  }

  const employeeName = employeeDisplayName(linkedEmployee);
  return {
    available: false,
    reason: 'PORTAL_USER_LINKED',
    message: `Email "${normalizedEmail}" is already linked to ${employeeName}`,
    employeeId: linkedEmployee.id,
    employeeName,
  };
}

export const EmployeeValidationService = {
  async prepareEmailForCreate(
    companyId: string,
    email: string,
    actorUserId: string,
    excludeEmployeeId?: string,
  ): Promise<EmailAvailabilityResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return {
        available: false,
        reason: 'DUPLICATE_EMAIL',
        message: 'Email is required',
      };
    }

    await WorkforceCleanupService.reclaimGhostRecordsForEmail(
      companyId,
      normalizedEmail,
      actorUserId,
    );
    return this.checkEmailAvailability(companyId, normalizedEmail, excludeEmployeeId);
  },

  async findActiveEmployeeByEmail(
    companyId: string,
    email: string,
    excludeEmployeeId?: string,
  ): Promise<EmployeeDocument | undefined> {
    return findActiveEmployeeByEmail(companyId, email, excludeEmployeeId);
  },

  async checkEmailAvailability(
    companyId: string,
    email: string,
    excludeEmployeeId?: string,
  ): Promise<EmailAvailabilityResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return {
        available: false,
        reason: 'DUPLICATE_EMAIL',
        message: 'Email is required',
      };
    }

    const activeEmployee = await findActiveEmployeeByEmail(
      companyId,
      normalizedEmail,
      excludeEmployeeId,
    );
    if (activeEmployee) {
      const employeeName = employeeDisplayName(activeEmployee);
      return {
        available: false,
        reason: 'DUPLICATE_EMAIL',
        message: `Email "${normalizedEmail}" is already assigned to ${employeeName}`,
        employeeId: activeEmployee.id,
        employeeName,
      };
    }

    const portalConflict = await findPortalUserConflict(
      companyId,
      normalizedEmail,
      excludeEmployeeId,
    );
    if (portalConflict) {
      return portalConflict;
    }

    return {
      available: true,
      reason: 'AVAILABLE',
      message: 'Email is available for a new employee.',
    };
  },

  async assertEmailAvailableForCreate(
    companyId: string,
    email: string,
    excludeEmployeeId?: string,
  ): Promise<void> {
    const result = await this.checkEmailAvailability(companyId, email, excludeEmployeeId);
    if (result.available) {
      return;
    }

    throw new ConflictError(result.message, ERROR_CODES.EMAIL_ALREADY_EXISTS, {
      field: 'email',
      value: email.trim().toLowerCase(),
      reason: result.reason,
      employeeId: result.employeeId,
    });
  },

  async assertUniqueEmail(companyId: string, email: string, excludeId?: string): Promise<void> {
    await this.assertEmailAvailableForCreate(companyId, email, excludeId);
  },

  async assertUniqueAadhaar(
    companyId: string,
    aadhaarNumber: string | undefined,
    excludeId?: string,
  ): Promise<void> {
    if (!aadhaarNumber?.trim()) {
      return;
    }
    const existing = await EmployeeRepository.findMany(
      { aadhaarNumber: aadhaarNumber.trim() },
      { companyId, includeDeleted: true },
    );
    const blocker = existing.find(
      (employee) =>
        employee.id !== excludeId &&
        employee.status === ENTITY_STATUS.ACTIVE &&
        !employee.isDeleted,
    );
    if (blocker) {
      throw new ConflictError(
        'An employee with this Aadhaar number already exists',
        ERROR_CODES.CONFLICT,
      );
    }
  },

  async assertUniquePan(
    companyId: string,
    panNumber: string | undefined,
    excludeId?: string,
  ): Promise<void> {
    if (!panNumber?.trim()) {
      return;
    }
    const normalized = panNumber.trim().toUpperCase();
    const existing = await EmployeeRepository.findMany(
      { panNumber: normalized },
      { companyId, includeDeleted: true },
    );
    const blocker = existing.find(
      (employee) =>
        employee.id !== excludeId &&
        employee.status === ENTITY_STATUS.ACTIVE &&
        !employee.isDeleted,
    );
    if (blocker) {
      throw new ConflictError('An employee with this PAN already exists', ERROR_CODES.CONFLICT);
    }
  },

  async assertNoManagerLoop(
    companyId: string,
    employeeId: string,
    managerId: string | undefined,
  ): Promise<void> {
    if (!managerId || managerId === employeeId) {
      if (managerId === employeeId) {
        throw new ValidationError('Employee cannot be their own manager', [{ managerId }], {
          code: ERROR_CODES.VALIDATION_FAILED,
        });
      }
      return;
    }

    const visited = new Set<string>([employeeId]);
    let currentManagerId: string | undefined = managerId;

    while (currentManagerId) {
      if (visited.has(currentManagerId)) {
        throw new ValidationError(
          'Invalid manager assignment: circular reporting loop detected',
          [{ managerId }],
          { code: ERROR_CODES.VALIDATION_FAILED },
        );
      }
      visited.add(currentManagerId);

      const manager = await EmployeeRepository.findById(currentManagerId, { companyId });
      if (!manager) {
        break;
      }
      currentManagerId = manager.reportingManagerId;
    }
  },

  async assertManagerHasNoActiveSubordinates(companyId: string, managerId: string): Promise<void> {
    const subordinates = await EmployeeRepository.findMany(
      {
        reportingManagerId: managerId,
        status: ENTITY_STATUS.ACTIVE,
      },
      { companyId },
    );
    if (subordinates.length > 0) {
      throw new ConflictError(
        'Cannot delete or deactivate manager with active direct reports. Reassign subordinates first.',
        ERROR_CODES.CONFLICT,
      );
    }
  },

  async assertEmployeeExists(companyId: string, employeeId: string): Promise<void> {
    const employee = await EmployeeRepository.findById(employeeId, {
      companyId,
      includeDeleted: true,
    });
    if (!employee || employee.isDeleted) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }
  },

  async assertManagerExists(companyId: string, managerId: string): Promise<void> {
    const manager = await EmployeeRepository.findById(managerId, { companyId });
    if (!manager) {
      throw new ValidationError('Reporting manager not found', [{ managerId }], {
        code: ERROR_CODES.NOT_FOUND,
      });
    }
  },

  async assertDepartmentExists(companyId: string, departmentId: string): Promise<void> {
    const department = await DepartmentRepository.findById(departmentId, { companyId });
    if (!department || department.status !== ENTITY_STATUS.ACTIVE) {
      throw new NotFoundError('Department not found or inactive', ERROR_CODES.NOT_FOUND);
    }
  },

  async assertDesignationExists(companyId: string, designationId: string): Promise<void> {
    const designation = await DesignationRepository.findById(designationId, { companyId });
    if (!designation || designation.status !== ENTITY_STATUS.ACTIVE) {
      throw new NotFoundError('Designation not found or inactive', ERROR_CODES.NOT_FOUND);
    }
  },

  async assertDesignationMatchesDepartment(
    companyId: string,
    departmentId: string,
    designationId: string,
  ): Promise<void> {
    const designation = await DesignationRepository.findById(designationId, { companyId });
    if (!designation) {
      throw new NotFoundError('Designation not found', ERROR_CODES.NOT_FOUND);
    }

    const linkedDepartments = designation.departmentIds ?? [];
    if (linkedDepartments.length > 0 && !linkedDepartments.includes(departmentId)) {
      throw new ValidationError(
        'Selected designation is not linked to the chosen department',
        [{ departmentId, designationId }],
        { code: ERROR_CODES.VALIDATION_FAILED },
      );
    }
  },

  async assertBranchExists(companyId: string, branchId: string | undefined): Promise<void> {
    if (!branchId) {
      return;
    }

    const branch = await BranchRepository.findById(branchId, { companyId });
    if (!branch || branch.status !== ENTITY_STATUS.ACTIVE) {
      throw new NotFoundError('Branch not found or inactive', ERROR_CODES.NOT_FOUND);
    }
  },

  async assertOrganizationPlacement(
    companyId: string,
    placement: { departmentId: string; designationId: string; branchId?: string },
  ): Promise<void> {
    await this.assertDepartmentExists(companyId, placement.departmentId);
    await this.assertDesignationExists(companyId, placement.designationId);
    await this.assertDesignationMatchesDepartment(
      companyId,
      placement.departmentId,
      placement.designationId,
    );
    await this.assertBranchExists(companyId, placement.branchId);
  },

  async assertNoDuplicateRelationship(
    companyId: string,
    employeeId: string,
    managerId: string,
    relationshipType: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await ReportingHierarchyRepository.findOne(
      {
        employeeId,
        managerId,
        relationshipType,
        effectiveTo: null,
      },
      { companyId },
    );
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('This manager relationship already exists', ERROR_CODES.CONFLICT);
    }
  },
};
