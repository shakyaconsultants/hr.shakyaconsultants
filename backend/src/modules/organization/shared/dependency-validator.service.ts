import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
  OfficeLocationRepository,
} from '@domain/organization/organization.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ProjectRepository } from '@domain/project/project.schemas.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { MASTER_DATA_ENTITY } from '@modules/organization/constants/organization.constants.js';
import { ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

interface DependencyCheck {
  repository: {
    exists: (filter: DomainQueryFilter, options?: { companyId?: string }) => Promise<boolean>;
    count: (filter: DomainQueryFilter, options?: { companyId?: string }) => Promise<number>;
  };
  filter: (entityId: string) => DomainQueryFilter;
  label: string;
  message: string;
}

const DELETE_DEPENDENCY_MAP: Partial<Record<MasterDataEntityKey, DependencyCheck[]>> = {
  [MASTER_DATA_ENTITY.BRANCH]: [
    {
      repository: DepartmentRepository,
      filter: (id) => ({ branchId: id }),
      label: 'Departments',
      message: 'Branch is referenced by one or more departments',
    },
    {
      repository: OfficeLocationRepository,
      filter: (id) => ({ branchId: id }),
      label: 'Office Locations',
      message: 'Branch is referenced by one or more office locations',
    },
  ],
  [MASTER_DATA_ENTITY.DEPARTMENT]: [
    {
      repository: DepartmentRepository,
      filter: (id) => ({ parentDepartmentId: id }),
      label: 'Child Departments',
      message: 'Department has child departments',
    },
    {
      repository: EmployeeRepository,
      filter: (id) => ({ departmentId: id }),
      label: 'Employees',
      message: 'Department has assigned employees',
    },

    {
      repository: DesignationRepository,
      filter: (id) => ({ departmentIds: id }),
      label: 'Designations',
      message: 'Department is referenced by one or more designations',
    },
    {
      repository: ProjectRepository,
      filter: (id) => ({ departmentId: id }),
      label: 'Projects',
      message: 'Department is referenced by one or more projects',
    },
  ],
  [MASTER_DATA_ENTITY.DESIGNATION]: [
    {
      repository: EmployeeRepository,
      filter: (id) => ({ designationId: id }),
      label: 'Employees',
      message: 'Designation has assigned employees',
    },
    {
      repository: DesignationRepository,
      filter: (id) => ({ promotionDesignationId: id }),
      label: 'Promotion Paths',
      message: 'Designation is used as a promotion path',
    },
  ],
};

export const DependencyValidatorService = {
  async assertCanDelete(
    entityKey: MasterDataEntityKey,
    entityId: string,
    companyId: string,
  ): Promise<void> {
    const checks = DELETE_DEPENDENCY_MAP[entityKey] ?? [];
    const blockers: Array<{ label: string; count: number; message: string }> = [];

    for (const check of checks) {
      const count = await check.repository.count(check.filter(entityId), { companyId });
      if (count > 0) {
        blockers.push({ label: check.label, count, message: check.message });
      }
    }

    if (blockers.length === 0) {
      return;
    }

    const summary = blockers.map((blocker) => `${blocker.count} ${blocker.label}`).join(', ');

    throw new ConflictError(
      `Cannot delete: ${summary} assigned. Move or archive them first.`,
      ERROR_CODES.CONFLICT,
      {
        entityKey,
        entityId,
        reason: 'DEPENDENCY',
        dependencies: blockers,
      },
    );
  },

  async assertNoDuplicateNameOrCode(
    entityKey: MasterDataEntityKey,
    companyId: string,
    fields: { name?: string; code?: string },
    excludeId?: string,
  ): Promise<void> {
    const { repository } = resolveEntityConfig(entityKey);

    const orConditions: DomainQueryFilter[] = [];
    if (fields.name) {
      orConditions.push({ name: { $regex: new RegExp(`^${fields.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    }
    if (fields.code) {
      orConditions.push({ code: fields.code.toUpperCase() });
    }

    if (orConditions.length === 0) {
      return;
    }

    const filter: DomainQueryFilter = {
      $or: orConditions,
      ...(excludeId ? { id: { $ne: excludeId } } : {}),
    };

    const duplicate = await repository.findOne(filter, { companyId });
    if (duplicate) {
      const doc = duplicate as unknown as Record<string, unknown>;
      const duplicateName = typeof doc.name === 'string' ? doc.name : '';
      const field = duplicateName.toLowerCase() === fields.name?.toLowerCase() ? 'name' : 'code';
      throw new ConflictError(
        field === 'name' ? `${fields.name} already exists.` : `Code ${fields.code} already exists.`,
        ERROR_CODES.CONFLICT,
        {
          entityKey,
          field,
          value: field === 'name' ? fields.name : fields.code,
        },
      );
    }
  },

  async assertBranchExists(branchId: string, companyId: string): Promise<void> {
    const exists = await BranchRepository.exists({ id: branchId }, { companyId });
    if (!exists) {
      throw new ConflictError('Referenced branch does not exist', ERROR_CODES.NOT_FOUND, { branchId });
    }
  },

  async assertDepartmentExists(departmentId: string, companyId: string): Promise<void> {
    const exists = await DepartmentRepository.exists({ id: departmentId }, { companyId });
    if (!exists) {
      throw new ConflictError('Referenced department does not exist', ERROR_CODES.NOT_FOUND, { departmentId });
    }
  },
};
