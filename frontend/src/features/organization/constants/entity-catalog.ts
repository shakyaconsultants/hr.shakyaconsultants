export const MASTER_ENTITIES = {
  BRANCH: 'branch',
  DEPARTMENT: 'department',
  DESIGNATION: 'designation',
  WORK_SHIFT: 'work-shift',
  HOLIDAY: 'holiday',
  EMPLOYMENT_TYPE: 'employment-type',
  SALARY_GRADE: 'salary-grade',
  LEAVE_TYPE: 'leave-type',
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
  { key: MASTER_ENTITIES.WORK_SHIFT, label: 'Work Shift', pluralLabel: 'Work Shifts', description: 'Shift schedules and attendance rules' },
  { key: MASTER_ENTITIES.HOLIDAY, label: 'Holiday', pluralLabel: 'Holidays', description: 'Company holiday calendar for attendance, leave, and payroll' },
  { key: MASTER_ENTITIES.EMPLOYMENT_TYPE, label: 'Employment Type', pluralLabel: 'Employment Types', description: 'Employment classifications' },
  { key: MASTER_ENTITIES.LEAVE_TYPE, label: 'Leave Type', pluralLabel: 'Leave Types', description: 'Leave policy types' },
];

export function getEntityMeta(key: string): EntityMeta | undefined {
  return ENTITY_CATALOG.find((entity) => entity.key === key);
}
