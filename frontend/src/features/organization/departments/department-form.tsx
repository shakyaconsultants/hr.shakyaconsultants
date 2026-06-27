import { MasterDataSelect } from '@/shared/components/master-data-select';
import { EmployeeSearchSelect } from '@/shared/components/employee-search-select';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { Input } from '@/shared/components/ui/input';
import type { DepartmentRecord } from '@/features/organization/departments/department.api';

export interface DepartmentFormValue {
  name: string;
  code?: string;
  description?: string;
  branchId?: string;
  parentDepartmentId?: string;
  headEmployeeId?: string;
  email?: string;
  internalNotes?: string;
  status: string;
}

interface DepartmentFormProps {
  value: DepartmentFormValue;
  onChange: (value: DepartmentFormValue) => void;
  excludeDepartmentId?: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function recordToDepartmentForm(record: DepartmentRecord | null): DepartmentFormValue {
  if (!record) {
    return { name: '', status: 'active' };
  }

  return {
    name: record.name,
    code: record.code,
    description: typeof record.description === 'string' ? record.description : undefined,
    branchId: record.branchId,
    parentDepartmentId: record.parentDepartmentId,
    headEmployeeId: record.headEmployeeId,
    email: record.email,
    internalNotes: typeof record.internalNotes === 'string' ? record.internalNotes : undefined,
    status: record.status ?? 'active',
  };
}

export function departmentFormToPayload(value: DepartmentFormValue): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: value.name.trim(),
    status: value.status,
  };

  if (value.description?.trim()) {
    payload.description = value.description.trim();
  }
  if (value.branchId) {
    payload.branchId = value.branchId;
  }
  if (value.parentDepartmentId) {
    payload.parentDepartmentId = value.parentDepartmentId;
  }
  if (value.headEmployeeId) {
    payload.headEmployeeId = value.headEmployeeId;
  }
  if (value.email?.trim()) {
    payload.email = value.email.trim();
  }
  if (value.internalNotes?.trim()) {
    payload.internalNotes = value.internalNotes.trim();
  }

  return payload;
}

export function DepartmentForm({ value, onChange, excludeDepartmentId }: DepartmentFormProps) {
  function updateField<K extends keyof DepartmentFormValue>(key: K, next: DepartmentFormValue[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-4">
      <FormSection title={FORM_SECTIONS.BASIC} description="Core department identity and availability.">
        <SelectField label="Department Name" required>
          <Input
            value={value.name}
            required
            placeholder="e.g. Engineering"
            onChange={(event) => updateField('name', event.target.value)}
          />
        </SelectField>

        <SelectField label="Status">
          <AsyncSearchSelect
            value={value.status}
            options={STATUS_OPTIONS}
            onChange={(next) => updateField('status', next)}
            clearable={false}
          />
        </SelectField>

        <SelectField label="Description">
          <textarea
            className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value.description ?? ''}
            rows={2}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </SelectField>
      </FormSection>

      <FormSection title={FORM_SECTIONS.RELATIONSHIPS} description="Organizational placement and leadership.">
        <SelectField label="Branch">
          <MasterDataSelect
            entityKey="branch"
            value={value.branchId ?? ''}
            placeholder="Select branch…"
            onChange={(next) => updateField('branchId', next || undefined)}
          />
        </SelectField>

        <SelectField
          label="Parent Department"
          hint={excludeDepartmentId ? 'Leave empty for a root-level department.' : undefined}
        >
          <MasterDataSelect
            entityKey="department"
            value={value.parentDepartmentId ?? ''}
            placeholder="Root department"
            onChange={(next) => updateField('parentDepartmentId', next || undefined)}
          />
        </SelectField>

        <SelectField label="Department Head">
          <EmployeeSearchSelect
            value={value.headEmployeeId ?? ''}
            placeholder="Select department head…"
            onChange={(next) => updateField('headEmployeeId', next || undefined)}
          />
        </SelectField>
      </FormSection>

      <FormSection title={FORM_SECTIONS.BUSINESS} description="Contact and operational details.">
        <SelectField label="Department Email">
          <Input
            type="email"
            value={value.email ?? ''}
            placeholder="department@company.com"
            onChange={(event) => updateField('email', event.target.value)}
          />
        </SelectField>
      </FormSection>

      <FormSection title={FORM_SECTIONS.ADDITIONAL} description="Internal context for administrators.">
        <SelectField label="Internal Notes">
          <textarea
            className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value.internalNotes ?? ''}
            rows={3}
            placeholder="Visible to administrators only"
            onChange={(event) => updateField('internalNotes', event.target.value)}
          />
        </SelectField>
      </FormSection>
    </div>
  );
}
