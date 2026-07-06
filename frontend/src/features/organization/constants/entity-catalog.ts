export const MASTER_ENTITIES = {
  BRANCH: 'branch',
  DEPARTMENT: 'department',
  DESIGNATION: 'designation',
  WORK_SHIFT: 'work-shift',
  HOLIDAY: 'holiday',
  HOLIDAY_MODULE: 'holiday-module',
  SALARY_GRADE: 'salary-grade',
  LEAVE_TYPE: 'leave-type',
} as const;

export type MasterEntityKey = (typeof MASTER_ENTITIES)[keyof typeof MASTER_ENTITIES];

export interface EntityMeta {
  key: MasterEntityKey;
  label: string;
  pluralLabel: string;
  description: string;
  /** When true, entity is API-only and not shown in Organization Setup nav */
  navHidden?: boolean;
}

export const ENTITY_CATALOG: EntityMeta[] = [
  {
    key: MASTER_ENTITIES.BRANCH,
    label: 'Branch',
    pluralLabel: 'Branches',
    description: 'Company branches and locations',
  },
  {
    key: MASTER_ENTITIES.DEPARTMENT,
    label: 'Department',
    pluralLabel: 'Departments',
    description: 'Organizational departments with hierarchy',
  },
  {
    key: MASTER_ENTITIES.DESIGNATION,
    label: 'Designation',
    pluralLabel: 'Designations',
    description: 'Job titles and hierarchy levels',
  },
  {
    key: MASTER_ENTITIES.WORK_SHIFT,
    label: 'Work Shift',
    pluralLabel: 'Work Shifts',
    description: 'Shift schedules and attendance rules',
  },
  {
    key: MASTER_ENTITIES.HOLIDAY,
    label: 'Holiday',
    pluralLabel: 'Holidays',
    description: 'Individual holidays — managed inside holiday modules',
    navHidden: true,
  },
  {
    key: MASTER_ENTITIES.HOLIDAY_MODULE,
    label: 'Holiday Modules',
    pluralLabel: 'Holiday Modules',
    description: 'Schedule weekly offs, festivals, and public holidays per module',
  },
  {
    key: MASTER_ENTITIES.LEAVE_TYPE,
    label: 'Leave Type',
    pluralLabel: 'Leave Types',
    description: 'Leave categories managed in Leave Setup',
    navHidden: true,
  },
];

export function getEntityMeta(key: string): EntityMeta | undefined {
  return ENTITY_CATALOG.find((entity) => entity.key === key);
}
