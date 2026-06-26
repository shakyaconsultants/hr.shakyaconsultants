import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
  JobRoleRepository,
  OfficeLocationRepository,
} from '@domain/organization/organization.schemas.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { MASTER_DATA_ENTITY } from '@modules/organization/constants/organization.constants.js';
import { ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

interface DependencyCheck {
  repository: { exists: (filter: DomainQueryFilter, options?: { companyId?: string }) => Promise<boolean> };
  filter: (entityId: string) => DomainQueryFilter;
  message: string;
}

const DELETE_DEPENDENCY_MAP: Partial<Record<MasterDataEntityKey, DependencyCheck[]>> = {
  [MASTER_DATA_ENTITY.BRANCH]: [
    {
      repository: DepartmentRepository,
      filter: (id) => ({ branchId: id }),
      message: 'Branch is referenced by one or more departments',
    },
    {
      repository: OfficeLocationRepository,
      filter: (id) => ({ branchId: id }),
      message: 'Branch is referenced by one or more office locations',
    },
  ],
  [MASTER_DATA_ENTITY.DEPARTMENT]: [
    {
      repository: DepartmentRepository,
      filter: (id) => ({ parentDepartmentId: id }),
      message: 'Department has child departments',
    },
    {
      repository: JobRoleRepository,
      filter: (id) => ({ departmentId: id }),
      message: 'Department is referenced by one or more job roles',
    },
  ],
  [MASTER_DATA_ENTITY.DESIGNATION]: [
    {
      repository: DesignationRepository,
      filter: (id) => ({ promotionDesignationId: id }),
      message: 'Designation is used as a promotion path',
    },
    {
      repository: JobRoleRepository,
      filter: (id) => ({ designationId: id }),
      message: 'Designation is referenced by one or more job roles',
    },
  ],
  [MASTER_DATA_ENTITY.SKILL]: [
    {
      repository: JobRoleRepository,
      filter: (id) => ({ requiredSkillIds: { $in: [id] } }),
      message: 'Skill is required by one or more job roles',
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

    for (const check of checks) {
      const referenced = await check.repository.exists(check.filter(entityId), { companyId });
      if (referenced) {
        throw new ConflictError(check.message, ERROR_CODES.CONFLICT, {
          entityKey,
          entityId,
          reason: 'DEPENDENCY',
        });
      }
    }
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
      throw new ConflictError(`Duplicate ${field} already exists`, ERROR_CODES.CONFLICT, {
        entityKey,
        field,
        value: field === 'name' ? fields.name : fields.code,
      });
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
