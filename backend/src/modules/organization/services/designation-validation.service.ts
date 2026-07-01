import {
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import { SalaryGradeRepository } from '@domain/master-data/master-data.schemas.js';
import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ConflictError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import {
  isValidHierarchyLevel,
  MAX_DESIGNATION_HIERARCHY_LEVEL,
  MIN_DESIGNATION_HIERARCHY_LEVEL,
} from '@modules/organization/constants/designation.constants.js';

const DEPARTMENT_REQUIRED_KEY = 'organization.designation_department_required';

async function isDepartmentRequired(companyId: string): Promise<boolean> {
  const setting = await AppSettingRepository.findOne({ key: DEPARTMENT_REQUIRED_KEY }, { companyId });
  return setting?.value === true;
}



export const DesignationValidationService = {
  async validateWrite(
    companyId: string,
    payload: Record<string, unknown>,
    designationId?: string,
  ): Promise<Record<string, unknown>> {
    const next: Record<string, unknown> = { ...payload };

    delete next.grade;
    if ('level' in next) {
      delete next.level;
    }

    const hierarchyLevel = next.hierarchyLevel;
    if (hierarchyLevel !== undefined && hierarchyLevel !== null && hierarchyLevel !== '') {
      const levelNumber = Number(hierarchyLevel);
      if (!isValidHierarchyLevel(levelNumber)) {
        throw new ConflictError(
          `Hierarchy level must be between ${MIN_DESIGNATION_HIERARCHY_LEVEL} and ${MAX_DESIGNATION_HIERARCHY_LEVEL}`,
          ERROR_CODES.CONFLICT,
        );
      }
      next.hierarchyLevel = levelNumber;
    }

    let departmentIds: string[] = [];
    if (Array.isArray(next.departmentIds)) {
      departmentIds = next.departmentIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    } else if (typeof next.departmentId === 'string' && next.departmentId.trim()) {
      departmentIds = [next.departmentId.trim()];
    }

    next.departmentIds = departmentIds;
    delete next.departmentId;

    if (await isDepartmentRequired(companyId)) {
      if (departmentIds.length === 0) {
        throw new ConflictError('Department is required for designations', ERROR_CODES.CONFLICT);
      }
    }

    if (departmentIds.length > 0) {
      const departments = await DepartmentRepository.findMany(
        { id: { $in: departmentIds }, status: ENTITY_STATUS.ACTIVE },
        { companyId },
      );
      if (departments.length !== departmentIds.length) {
        throw new NotFoundError('One or more departments must exist and be active', ERROR_CODES.NOT_FOUND);
      }
    }



    if (typeof next.salaryGradeId === 'string' && next.salaryGradeId.trim()) {
      const salaryGrade = await SalaryGradeRepository.findById(next.salaryGradeId, { companyId });
      if (!salaryGrade || salaryGrade.status !== ENTITY_STATUS.ACTIVE) {
        throw new NotFoundError('Salary grade must exist and be active', ERROR_CODES.NOT_FOUND);
      }
    } else {
      delete next.salaryGradeId;
    }

    if (typeof next.promotionDesignationId === 'string' && next.promotionDesignationId.trim()) {
      if (designationId && next.promotionDesignationId === designationId) {
        throw new ConflictError('Promotion path cannot reference the same designation', ERROR_CODES.CONFLICT);
      }

      const promotion = await DesignationRepository.findById(next.promotionDesignationId, { companyId });
      if (!promotion || promotion.status !== ENTITY_STATUS.ACTIVE) {
        throw new NotFoundError('Promotion designation must exist and be active', ERROR_CODES.NOT_FOUND);
      }

      const currentLevel = typeof next.hierarchyLevel === 'number' ? next.hierarchyLevel : undefined;
      const promotionLevel = promotion.hierarchyLevel;
      if (currentLevel !== undefined && promotionLevel !== undefined && promotionLevel <= currentLevel) {
        throw new ConflictError(
          'Promotion path must target a designation with a higher hierarchy level',
          ERROR_CODES.CONFLICT,
        );
      }
    } else {
      delete next.promotionDesignationId;
    }

    return next;
  },

  async assertUniqueName(
    companyId: string,
    name: string,
    _departmentId: string | undefined,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = {
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    };

    if (excludeId) {
      filter.id = { $ne: excludeId };
    }

    const duplicate = await DesignationRepository.findOne(filter, { companyId });
    if (duplicate) {
      throw new ConflictError('A designation with this name already exists', ERROR_CODES.CONFLICT);
    }
  },
};
