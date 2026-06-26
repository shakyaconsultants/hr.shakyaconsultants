export const MASTER_ENTITIES = {
  BRANCH: 'branch',
  DEPARTMENT: 'department',
  DESIGNATION: 'designation',
  JOB_ROLE: 'job-role',
  OFFICE_LOCATION: 'office-location',
  WORK_SHIFT: 'work-shift',
  HOLIDAY: 'holiday',
  EMPLOYMENT_TYPE: 'employment-type',
  SALARY_GRADE: 'salary-grade',
  LEAVE_TYPE: 'leave-type',
  PROJECT_CATEGORY: 'project-category',
  TECHNOLOGY: 'technology',
  SKILL: 'skill',
} as const;

export type MasterEntityKey = (typeof MASTER_ENTITIES)[keyof typeof MASTER_ENTITIES];

export interface EntityMeta {
  key: MasterEntityKey;
  label: string;
  pluralLabel: string;
  description: string;
}

export const ENTITY_CATALOG: EntityMeta[] = [
  { key: MASTER_ENTITIES.BRANCH, label: 'Branch', pluralLabel: 'Branches', description: 'Company branches and locations' },
  { key: MASTER_ENTITIES.DEPARTMENT, label: 'Department', pluralLabel: 'Departments', description: 'Organizational departments with hierarchy' },
  { key: MASTER_ENTITIES.DESIGNATION, label: 'Designation', pluralLabel: 'Designations', description: 'Job titles and hierarchy levels' },
  { key: MASTER_ENTITIES.JOB_ROLE, label: 'Job Role', pluralLabel: 'Job Roles', description: 'Roles with skills and responsibilities' },
  { key: MASTER_ENTITIES.OFFICE_LOCATION, label: 'Office Location', pluralLabel: 'Office Locations', description: 'Physical and remote office locations' },
  { key: MASTER_ENTITIES.WORK_SHIFT, label: 'Work Shift', pluralLabel: 'Work Shifts', description: 'Shift schedules and attendance rules' },
  { key: MASTER_ENTITIES.HOLIDAY, label: 'Holiday', pluralLabel: 'Holidays', description: 'Holiday calendar entries' },
  { key: MASTER_ENTITIES.EMPLOYMENT_TYPE, label: 'Employment Type', pluralLabel: 'Employment Types', description: 'Employment classifications' },
  { key: MASTER_ENTITIES.SALARY_GRADE, label: 'Salary Grade', pluralLabel: 'Salary Grades', description: 'Compensation grade bands' },
  { key: MASTER_ENTITIES.LEAVE_TYPE, label: 'Leave Type', pluralLabel: 'Leave Types', description: 'Leave policy types' },
  { key: MASTER_ENTITIES.PROJECT_CATEGORY, label: 'Project Category', pluralLabel: 'Project Categories', description: 'Project classification categories' },
  { key: MASTER_ENTITIES.TECHNOLOGY, label: 'Technology', pluralLabel: 'Technologies', description: 'Technology stack catalog' },
  { key: MASTER_ENTITIES.SKILL, label: 'Skill', pluralLabel: 'Skills', description: 'Skills for roles and resume matching' },
];

export function getEntityMeta(key: string): EntityMeta | undefined {
  return ENTITY_CATALOG.find((entity) => entity.key === key);
}
