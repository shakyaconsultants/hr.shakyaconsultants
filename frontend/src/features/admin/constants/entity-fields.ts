import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';

export type EntityFieldType = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'time' | 'datetime' | 'duration' | 'boolean' | 'json';

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

/** Fields used on create/edit forms — code is always system-generated */
export function getEntityFormFields(entityKey: MasterEntityKey): EntityFieldDefinition[] {
  return getEntityFields(entityKey).filter((field) => field.key !== 'code');
}

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
    ...BASE_FIELDS.map((field) => (field.key === 'code' ? { ...field, required: false } : field)),
    { key: 'parentDepartmentId', label: 'Parent Department', type: 'select', refEntity: 'department' },
    { key: 'headEmployeeId', label: 'Department Head', type: 'text' },
    { key: 'branchId', label: 'Branch', type: 'select', refEntity: 'branch' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'internalNotes', label: 'Internal Notes', type: 'textarea' },
  ],
  designation: [
    ...BASE_FIELDS.map((field) => (field.key === 'code' ? { ...field, required: false } : field)),
    { key: 'hierarchyLevel', label: 'Hierarchy Level', type: 'number' },
    { key: 'departmentId', label: 'Department', type: 'select', refEntity: 'department' },
    { key: 'salaryGradeId', label: 'Salary Grade', type: 'select', refEntity: 'salary-grade' },
  ],

  'work-shift': [
    ...BASE_FIELDS,
  ],
  holiday: [
    ...BASE_FIELDS.filter((field) => field.key !== 'description'),
    { key: 'date', label: 'Holiday Date', type: 'date', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'type', label: 'Type', type: 'select', options: [{ value: 'public', label: 'Public' }, { value: 'company', label: 'Company' }, { value: 'branch', label: 'Branch' }, { value: 'optional', label: 'Optional' }] },
    { key: 'branchId', label: 'Branch (optional)', type: 'select', refEntity: 'branch' },
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
  'leave-type': [
    ...BASE_FIELDS,
    { key: 'isPaid', label: 'Paid Leave', type: 'boolean' },
    { key: 'maxDaysPerYear', label: 'Max Days/Year', type: 'duration' },
    { key: 'color', label: 'Color', type: 'text' },
  ],
};

export function getEntityFields(entityKey: MasterEntityKey): EntityFieldDefinition[] {
  return ENTITY_FIELD_DEFINITIONS[entityKey] ?? BASE_FIELDS;
}
