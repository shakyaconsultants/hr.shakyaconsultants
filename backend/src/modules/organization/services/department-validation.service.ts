import {
  BranchRepository,
  DepartmentRepository,
} from '@domain/organization/organization.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ConflictError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

const MAX_HIERARCHY_DEPTH = 50;

function normalizeOptionalId(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

export const DepartmentValidationService = {
  async assertActiveHead(companyId: string, headEmployeeId?: string): Promise<void> {
    if (!headEmployeeId) {
      return;
    }

    const employee = await EmployeeRepository.findById(headEmployeeId, { companyId });
    if (!employee) {
      throw new NotFoundError('Department head employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (employee.status !== ENTITY_STATUS.ACTIVE) {
      throw new ConflictError('Department head must be an active employee', ERROR_CODES.CONFLICT, {
        headEmployeeId,
        status: employee.status,
      });
    }
  },

  async assertValidBranch(companyId: string, branchId?: string): Promise<void> {
    if (!branchId) {
      return;
    }

    const branch = await BranchRepository.findById(branchId, { companyId });
    if (!branch || branch.status !== ENTITY_STATUS.ACTIVE) {
      throw new ConflictError('Branch must exist and be active', ERROR_CODES.CONFLICT, { branchId });
    }
  },

  async assertValidParent(
    companyId: string,
    departmentId: string | undefined,
    parentDepartmentId?: string,
  ): Promise<void> {
    if (!parentDepartmentId) {
      return;
    }

    if (departmentId && parentDepartmentId === departmentId) {
      throw new ConflictError('Department cannot be its own parent', ERROR_CODES.CONFLICT);
    }

    const parent = await DepartmentRepository.findById(parentDepartmentId, { companyId });
    if (!parent) {
      throw new NotFoundError('Parent department not found', ERROR_CODES.NOT_FOUND);
    }

    if (parent.status !== ENTITY_STATUS.ACTIVE) {
      throw new ConflictError('Parent department must be active', ERROR_CODES.CONFLICT, { parentDepartmentId });
    }
  },

  async assertNoCircularHierarchy(
    companyId: string,
    departmentId: string | undefined,
    parentDepartmentId?: string,
  ): Promise<void> {
    if (!parentDepartmentId || !departmentId) {
      return;
    }

    let currentId: string | undefined = parentDepartmentId;
    let depth = 0;

    while (currentId && depth < MAX_HIERARCHY_DEPTH) {
      if (currentId === departmentId) {
        throw new ConflictError('Circular department hierarchy is not allowed', ERROR_CODES.CONFLICT, {
          departmentId,
          parentDepartmentId,
        });
      }

      const ancestor = await DepartmentRepository.findById(currentId, { companyId });
      if (!ancestor) {
        break;
      }

      currentId = typeof ancestor.parentDepartmentId === 'string' ? ancestor.parentDepartmentId : undefined;
      depth += 1;
    }
  },

  sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const next = { ...payload };

    delete next.costCenterCode;
    delete next.color;

    if (typeof next.email === 'string') {
      next.email = next.email.trim().toLowerCase() || undefined;
    }

    if (typeof next.internalNotes === 'string') {
      next.internalNotes = next.internalNotes.trim() || undefined;
    }

    if (typeof next.code === 'string') {
      next.code = next.code.trim().toUpperCase() || undefined;
    }

    next.parentDepartmentId = normalizeOptionalId(next.parentDepartmentId);
    next.headEmployeeId = normalizeOptionalId(next.headEmployeeId);
    next.branchId = normalizeOptionalId(next.branchId);

    return next;
  },

  async validateWrite(
    companyId: string,
    payload: Record<string, unknown>,
    departmentId?: string,
  ): Promise<Record<string, unknown>> {
    const sanitized = this.sanitizePayload(payload);

    await this.assertValidBranch(companyId, sanitized.branchId as string | undefined);
    await this.assertValidParent(companyId, departmentId, sanitized.parentDepartmentId as string | undefined);
    await this.assertNoCircularHierarchy(companyId, departmentId, sanitized.parentDepartmentId as string | undefined);
    await this.assertActiveHead(companyId, sanitized.headEmployeeId as string | undefined);

    return sanitized;
  },
};
