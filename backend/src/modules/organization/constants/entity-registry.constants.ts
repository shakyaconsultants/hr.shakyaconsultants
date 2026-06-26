import type { BaseRepository } from '@infrastructure/database/base.repository.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
  HolidayRepository,
  JobRoleRepository,
  OfficeLocationRepository,
  WorkShiftRepository,
} from '@domain/organization/organization.schemas.js';
import {
  EmploymentTypeRepository,
  LeaveTypeRepository,
  ProjectCategoryRepository,
  SalaryGradeRepository,
  SkillRepository,
  TechnologyRepository,
} from '@domain/master-data/master-data.schemas.js';
import {
  MASTER_DATA_ENTITY,
  type MasterDataEntityKey,
} from '@modules/organization/constants/organization.constants.js';
import { ORG_PERMISSIONS } from '@modules/organization/constants/organization-permissions.constants.js';

export interface EntityPermissions {
  read: string;
  create: string;
  update: string;
  delete: string;
}

export interface MasterDataEntityConfig {
  key: MasterDataEntityKey;
  entityType: string;
  label: string;
  repository: BaseRepository<BaseDocument>;
  permissions: EntityPermissions;
  searchFields: string[];
  duplicateFields: Array<'name' | 'code'>;
  cacheEnabled: boolean;
}

export const MASTER_DATA_ENTITY_REGISTRY: Record<MasterDataEntityKey, MasterDataEntityConfig> = {
  [MASTER_DATA_ENTITY.BRANCH]: {
    key: MASTER_DATA_ENTITY.BRANCH,
    entityType: 'branch',
    label: 'Branch',
    repository: BranchRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.BRANCH_READ,
      create: ORG_PERMISSIONS.BRANCH_CREATE,
      update: ORG_PERMISSIONS.BRANCH_UPDATE,
      delete: ORG_PERMISSIONS.BRANCH_DELETE,
    },
    searchFields: ['name', 'code', 'email', 'address.city'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: true,
  },
  [MASTER_DATA_ENTITY.DEPARTMENT]: {
    key: MASTER_DATA_ENTITY.DEPARTMENT,
    entityType: 'department',
    label: 'Department',
    repository: DepartmentRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.DEPARTMENT_READ,
      create: ORG_PERMISSIONS.DEPARTMENT_CREATE,
      update: ORG_PERMISSIONS.DEPARTMENT_UPDATE,
      delete: ORG_PERMISSIONS.DEPARTMENT_DELETE,
    },
    searchFields: ['name', 'code', 'description'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: true,
  },
  [MASTER_DATA_ENTITY.DESIGNATION]: {
    key: MASTER_DATA_ENTITY.DESIGNATION,
    entityType: 'designation',
    label: 'Designation',
    repository: DesignationRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.DESIGNATION_READ,
      create: ORG_PERMISSIONS.DESIGNATION_CREATE,
      update: ORG_PERMISSIONS.DESIGNATION_UPDATE,
      delete: ORG_PERMISSIONS.DESIGNATION_DELETE,
    },
    searchFields: ['name', 'code', 'description'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.JOB_ROLE]: {
    key: MASTER_DATA_ENTITY.JOB_ROLE,
    entityType: 'job-role',
    label: 'Job Role',
    repository: JobRoleRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.JOB_ROLE_READ,
      create: ORG_PERMISSIONS.JOB_ROLE_CREATE,
      update: ORG_PERMISSIONS.JOB_ROLE_UPDATE,
      delete: ORG_PERMISSIONS.JOB_ROLE_DELETE,
    },
    searchFields: ['name', 'code', 'description'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: true,
  },
  [MASTER_DATA_ENTITY.OFFICE_LOCATION]: {
    key: MASTER_DATA_ENTITY.OFFICE_LOCATION,
    entityType: 'office-location',
    label: 'Office Location',
    repository: OfficeLocationRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.OFFICE_LOCATION_READ,
      create: ORG_PERMISSIONS.OFFICE_LOCATION_CREATE,
      update: ORG_PERMISSIONS.OFFICE_LOCATION_UPDATE,
      delete: ORG_PERMISSIONS.OFFICE_LOCATION_DELETE,
    },
    searchFields: ['name', 'code', 'address.city'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.WORK_SHIFT]: {
    key: MASTER_DATA_ENTITY.WORK_SHIFT,
    entityType: 'work-shift',
    label: 'Work Shift',
    repository: WorkShiftRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.WORK_SHIFT_READ,
      create: ORG_PERMISSIONS.WORK_SHIFT_CREATE,
      update: ORG_PERMISSIONS.WORK_SHIFT_UPDATE,
      delete: ORG_PERMISSIONS.WORK_SHIFT_DELETE,
    },
    searchFields: ['name', 'code'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.HOLIDAY]: {
    key: MASTER_DATA_ENTITY.HOLIDAY,
    entityType: 'holiday',
    label: 'Holiday',
    repository: HolidayRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.HOLIDAY_READ,
      create: ORG_PERMISSIONS.HOLIDAY_CREATE,
      update: ORG_PERMISSIONS.HOLIDAY_UPDATE,
      delete: ORG_PERMISSIONS.HOLIDAY_DELETE,
    },
    searchFields: ['name', 'description'],
    duplicateFields: ['name'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.EMPLOYMENT_TYPE]: {
    key: MASTER_DATA_ENTITY.EMPLOYMENT_TYPE,
    entityType: 'employment-type',
    label: 'Employment Type',
    repository: EmploymentTypeRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.EMPLOYMENT_TYPE_READ,
      create: ORG_PERMISSIONS.EMPLOYMENT_TYPE_CREATE,
      update: ORG_PERMISSIONS.EMPLOYMENT_TYPE_UPDATE,
      delete: ORG_PERMISSIONS.EMPLOYMENT_TYPE_DELETE,
    },
    searchFields: ['name', 'code'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.SALARY_GRADE]: {
    key: MASTER_DATA_ENTITY.SALARY_GRADE,
    entityType: 'salary-grade',
    label: 'Salary Grade',
    repository: SalaryGradeRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.SALARY_GRADE_READ,
      create: ORG_PERMISSIONS.SALARY_GRADE_CREATE,
      update: ORG_PERMISSIONS.SALARY_GRADE_UPDATE,
      delete: ORG_PERMISSIONS.SALARY_GRADE_DELETE,
    },
    searchFields: ['name', 'code'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.LEAVE_TYPE]: {
    key: MASTER_DATA_ENTITY.LEAVE_TYPE,
    entityType: 'leave-type',
    label: 'Leave Type',
    repository: LeaveTypeRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.LEAVE_TYPE_READ,
      create: ORG_PERMISSIONS.LEAVE_TYPE_CREATE,
      update: ORG_PERMISSIONS.LEAVE_TYPE_UPDATE,
      delete: ORG_PERMISSIONS.LEAVE_TYPE_DELETE,
    },
    searchFields: ['name', 'code'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.PROJECT_CATEGORY]: {
    key: MASTER_DATA_ENTITY.PROJECT_CATEGORY,
    entityType: 'project-category',
    label: 'Project Category',
    repository: ProjectCategoryRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.PROJECT_CATEGORY_READ,
      create: ORG_PERMISSIONS.PROJECT_CATEGORY_CREATE,
      update: ORG_PERMISSIONS.PROJECT_CATEGORY_UPDATE,
      delete: ORG_PERMISSIONS.PROJECT_CATEGORY_DELETE,
    },
    searchFields: ['name', 'code'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: false,
  },
  [MASTER_DATA_ENTITY.TECHNOLOGY]: {
    key: MASTER_DATA_ENTITY.TECHNOLOGY,
    entityType: 'technology',
    label: 'Technology',
    repository: TechnologyRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.TECHNOLOGY_READ,
      create: ORG_PERMISSIONS.TECHNOLOGY_CREATE,
      update: ORG_PERMISSIONS.TECHNOLOGY_UPDATE,
      delete: ORG_PERMISSIONS.TECHNOLOGY_DELETE,
    },
    searchFields: ['name', 'code', 'category'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: true,
  },
  [MASTER_DATA_ENTITY.SKILL]: {
    key: MASTER_DATA_ENTITY.SKILL,
    entityType: 'skill',
    label: 'Skill',
    repository: SkillRepository as unknown as BaseRepository<BaseDocument>,
    permissions: {
      read: ORG_PERMISSIONS.SKILL_READ,
      create: ORG_PERMISSIONS.SKILL_CREATE,
      update: ORG_PERMISSIONS.SKILL_UPDATE,
      delete: ORG_PERMISSIONS.SKILL_DELETE,
    },
    searchFields: ['name', 'code', 'category'],
    duplicateFields: ['name', 'code'],
    cacheEnabled: true,
  },
};

export function resolveEntityConfig(entityKey: string): MasterDataEntityConfig {
  if (!(entityKey in MASTER_DATA_ENTITY_REGISTRY)) {
    throw new Error(`Unknown master data entity: ${entityKey}`);
  }
  return MASTER_DATA_ENTITY_REGISTRY[entityKey as MasterDataEntityKey];
}

export function listEntityKeys(): MasterDataEntityKey[] {
  return Object.values(MASTER_DATA_ENTITY);
}
