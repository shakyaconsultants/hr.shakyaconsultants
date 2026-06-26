import {
  EmployeeRepository,
  ReportingHierarchyRepository,
} from '@domain/employee/employee.schemas.js';
import { ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const EmployeeValidationService = {
  async assertUniqueEmail(companyId: string, email: string, excludeId?: string): Promise<void> {
    const existing = await EmployeeRepository.findOne(
      { email: email.toLowerCase(), status: ENTITY_STATUS.ACTIVE },
      { companyId },
    );
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('An active employee with this email already exists', ERROR_CODES.CONFLICT);
    }
  },

  async assertUniqueAadhaar(companyId: string, aadhaarNumber: string | undefined, excludeId?: string): Promise<void> {
    if (!aadhaarNumber?.trim()) {
      return;
    }
    const existing = await EmployeeRepository.findOne(
      { aadhaarNumber: aadhaarNumber.trim() },
      { companyId },
    );
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('An employee with this Aadhaar number already exists', ERROR_CODES.CONFLICT);
    }
  },

  async assertUniquePan(companyId: string, panNumber: string | undefined, excludeId?: string): Promise<void> {
    if (!panNumber?.trim()) {
      return;
    }
    const normalized = panNumber.trim().toUpperCase();
    const existing = await EmployeeRepository.findOne(
      { panNumber: normalized },
      { companyId },
    );
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('An employee with this PAN already exists', ERROR_CODES.CONFLICT);
    }
  },

  async assertNoManagerLoop(companyId: string, employeeId: string, managerId: string | undefined): Promise<void> {
    if (!managerId || managerId === employeeId) {
      if (managerId === employeeId) {
        throw new ValidationError('Employee cannot be their own manager', [{ managerId }], { code: ERROR_CODES.VALIDATION_FAILED });
      }
      return;
    }

    const visited = new Set<string>([employeeId]);
    let currentManagerId: string | undefined = managerId;

    while (currentManagerId) {
      if (visited.has(currentManagerId)) {
        throw new ValidationError('Invalid manager assignment: circular reporting loop detected', [{ managerId }], { code: ERROR_CODES.VALIDATION_FAILED });
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
    const employee = await EmployeeRepository.findById(employeeId, { companyId });
    if (!employee) {
      throw new ValidationError('Employee not found', [{ employeeId }], { code: ERROR_CODES.NOT_FOUND });
    }
  },

  async assertManagerExists(companyId: string, managerId: string): Promise<void> {
    const manager = await EmployeeRepository.findById(managerId, { companyId });
    if (!manager) {
      throw new ValidationError('Reporting manager not found', [{ managerId }], { code: ERROR_CODES.NOT_FOUND });
    }
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
