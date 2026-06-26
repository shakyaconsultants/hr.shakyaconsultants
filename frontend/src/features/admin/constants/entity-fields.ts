import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';

export type EntityFieldType = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'boolean' | 'json';

export interface EntityFieldDefinition {
  key: string;
  label: string;
  type: EntityFieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  refEntity?: MasterEntityKey;
}

const BASE_FIELDS: EntityFieldDefinition[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'code', label: 'Code', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];

export const ENTITY_FIELD_DEFINITIONS: Record<MasterEntityKey, EntityFieldDefinition[]> = {
  branch: [
    ...BASE_FIELDS,
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'timezone', label: 'Timezone', type: 'text' },
    { key: 'address.line1', label: 'Address Line 1', type: 'text', required: true },
    { key: 'address.city', label: 'City', type: 'text', required: true },
    { key: 'address.state', label: 'State', type: 'text', required: true },
    { key: 'address.country', label: 'Country', type: 'text', required: true },
    { key: 'address.postalCode', label: 'Postal Code', type: 'text', required: true },
  ],
  department: [
    ...BASE_FIELDS,
    { key: 'parentDepartmentId', label: 'Parent Department', type: 'select', refEntity: 'department' },
    { key: 'headEmployeeId', label: 'Department Head (Employee ID)', type: 'text' },
    { key: 'branchId', label: 'Branch', type: 'select', refEntity: 'branch' },
    { key: 'costCenterCode', label: 'Cost Center', type: 'text' },
    { key: 'color', label: 'Color', type: 'text' },
  ],
  designation: [
    ...BASE_FIELDS,
    { key: 'level', label: 'Level', type: 'number' },
    { key: 'grade', label: 'Grade', type: 'text' },
    { key: 'salaryGradeId', label: 'Salary Grade', type: 'select', refEntity: 'salary-grade' },
  ],
  'job-role': [
    ...BASE_FIELDS,
    { key: 'departmentId', label: 'Department', type: 'select', refEntity: 'department' },
    { key: 'designationId', label: 'Designation', type: 'select', refEntity: 'designation' },
    { key: 'employmentTypeId', label: 'Employment Type', type: 'select', refEntity: 'employment-type' },
    { key: 'salaryGradeId', label: 'Salary Grade', type: 'select', refEntity: 'salary-grade' },
    { key: 'experienceMinYears', label: 'Min Experience (years)', type: 'number' },
    { key: 'experienceMaxYears', label: 'Max Experience (years)', type: 'number' },
    { key: 'level', label: 'Level', type: 'number' },
    { key: 'responsibilities', label: 'Responsibilities (comma-separated)', type: 'textarea' },
  ],
  'office-location': [
    ...BASE_FIELDS,
    { key: 'branchId', label: 'Branch', type: 'select', refEntity: 'branch' },
    { key: 'isRemote', label: 'Remote Location', type: 'boolean' },
    { key: 'address.line1', label: 'Address Line 1', type: 'text' },
    { key: 'address.city', label: 'City', type: 'text' },
  ],
  'work-shift': [
    ...BASE_FIELDS,
    { key: 'startTime', label: 'Start Time (HH:mm)', type: 'text' },
    { key: 'endTime', label: 'End Time (HH:mm)', type: 'text' },
    { key: 'graceMinutes', label: 'Grace Minutes', type: 'number' },
  ],
  holiday: [
    ...BASE_FIELDS,
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'type', label: 'Type', type: 'select', options: [{ value: 'public', label: 'Public' }, { value: 'optional', label: 'Optional' }] },
    { key: 'isRecurring', label: 'Recurring', type: 'boolean' },
  ],
  'employment-type': [
    ...BASE_FIELDS,
    { key: 'isDefault', label: 'Default', type: 'boolean' },
  ],
  'salary-grade': [
    ...BASE_FIELDS,
    { key: 'minSalary', label: 'Min Salary', type: 'number' },
    { key: 'maxSalary', label: 'Max Salary', type: 'number' },
    { key: 'level', label: 'Level', type: 'number' },
  ],
  skill: [
    ...BASE_FIELDS,
    { key: 'category', label: 'Category', type: 'text' },
  ],
  technology: [
    ...BASE_FIELDS,
    { key: 'category', label: 'Category', type: 'text' },
  ],
  'leave-type': [
    ...BASE_FIELDS,
    { key: 'isPaid', label: 'Paid Leave', type: 'boolean' },
    { key: 'maxDaysPerYear', label: 'Max Days/Year', type: 'number' },
    { key: 'color', label: 'Color', type: 'text' },
  ],
  'project-category': [...BASE_FIELDS],
};

export function getEntityFields(entityKey: MasterEntityKey): EntityFieldDefinition[] {
  return ENTITY_FIELD_DEFINITIONS[entityKey] ?? BASE_FIELDS;
}
