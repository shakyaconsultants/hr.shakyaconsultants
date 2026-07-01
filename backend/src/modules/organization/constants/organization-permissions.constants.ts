/** Dot-notation permissions for organization master data (Part 13) */
export const ORG_PERMISSIONS = {
  COMPANY_READ: 'company.read',
  COMPANY_UPDATE: 'company.update',

  BRANCH_READ: 'branch.read',
  BRANCH_CREATE: 'branch.create',
  BRANCH_UPDATE: 'branch.update',
  BRANCH_DELETE: 'branch.delete',

  DEPARTMENT_READ: 'department.read',
  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_UPDATE: 'department.update',
  DEPARTMENT_DELETE: 'department.delete',

  DESIGNATION_READ: 'designation.read',
  DESIGNATION_CREATE: 'designation.create',
  DESIGNATION_UPDATE: 'designation.update',
  DESIGNATION_DELETE: 'designation.delete',


  OFFICE_LOCATION_READ: 'office-location.read',
  OFFICE_LOCATION_CREATE: 'office-location.create',
  OFFICE_LOCATION_UPDATE: 'office-location.update',
  OFFICE_LOCATION_DELETE: 'office-location.delete',

  WORK_SHIFT_READ: 'work-shift.read',
  WORK_SHIFT_CREATE: 'work-shift.create',
  WORK_SHIFT_UPDATE: 'work-shift.update',
  WORK_SHIFT_DELETE: 'work-shift.delete',

  HOLIDAY_READ: 'holiday.read',
  HOLIDAY_CREATE: 'holiday.create',
  HOLIDAY_UPDATE: 'holiday.update',
  HOLIDAY_DELETE: 'holiday.delete',

  EMPLOYMENT_TYPE_READ: 'employment-type.read',
  EMPLOYMENT_TYPE_CREATE: 'employment-type.create',
  EMPLOYMENT_TYPE_UPDATE: 'employment-type.update',
  EMPLOYMENT_TYPE_DELETE: 'employment-type.delete',

  SALARY_GRADE_READ: 'salary-grade.read',
  SALARY_GRADE_CREATE: 'salary-grade.create',
  SALARY_GRADE_UPDATE: 'salary-grade.update',
  SALARY_GRADE_DELETE: 'salary-grade.delete',

  LEAVE_TYPE_READ: 'leave-type.read',
  LEAVE_TYPE_CREATE: 'leave-type.create',
  LEAVE_TYPE_UPDATE: 'leave-type.update',
  LEAVE_TYPE_DELETE: 'leave-type.delete',

  PROJECT_CATEGORY_READ: 'project-category.read',
  PROJECT_CATEGORY_CREATE: 'project-category.create',
  PROJECT_CATEGORY_UPDATE: 'project-category.update',
  PROJECT_CATEGORY_DELETE: 'project-category.delete',

  TECHNOLOGY_READ: 'technology.read',
  TECHNOLOGY_CREATE: 'technology.create',
  TECHNOLOGY_UPDATE: 'technology.update',
  TECHNOLOGY_DELETE: 'technology.delete',

  SKILL_READ: 'skill.read',
  SKILL_CREATE: 'skill.create',
  SKILL_UPDATE: 'skill.update',
  SKILL_DELETE: 'skill.delete',

  SETTINGS_READ: 'settings.read',
  SETTINGS_MANAGE: 'settings.manage',

  BULK_MANAGE: 'organization.bulk',
  EXPORT: 'organization.export',
  IMPORT: 'organization.import',
} as const;

export const ORG_READ_PERMISSIONS: string[] = [
  ORG_PERMISSIONS.COMPANY_READ,
  ORG_PERMISSIONS.BRANCH_READ,
  ORG_PERMISSIONS.DEPARTMENT_READ,
  ORG_PERMISSIONS.DESIGNATION_READ,
  ORG_PERMISSIONS.OFFICE_LOCATION_READ,
  ORG_PERMISSIONS.WORK_SHIFT_READ,
  ORG_PERMISSIONS.HOLIDAY_READ,
  ORG_PERMISSIONS.EMPLOYMENT_TYPE_READ,
  ORG_PERMISSIONS.SALARY_GRADE_READ,
  ORG_PERMISSIONS.LEAVE_TYPE_READ,
  ORG_PERMISSIONS.PROJECT_CATEGORY_READ,
  ORG_PERMISSIONS.TECHNOLOGY_READ,
  ORG_PERMISSIONS.SKILL_READ,
  ORG_PERMISSIONS.SETTINGS_READ,
];
