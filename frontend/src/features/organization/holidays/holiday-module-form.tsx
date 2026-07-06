import { useMemo } from 'react';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { FormSection } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import type { HolidayModuleRecord } from '@/features/organization/holidays/holiday-module.api';
import { HOLIDAY_MODULE_TYPES } from '@/features/organization/holidays/holiday-module.constants';

export interface HolidayModuleFormValue {
  name: string;
  moduleType: string;
  calendarYear: string;
  branchId: string;
  departmentIds: string[];
  description: string;
  status: string;
}

export function defaultHolidayModuleFormValue(): HolidayModuleFormValue {
  return {
    name: '',
    moduleType: 'custom',
    calendarYear: String(new Date().getFullYear()),
    branchId: '',
    departmentIds: [],
    description: '',
    status: 'active',
  };
}

export function recordToHolidayModuleForm(
  record: HolidayModuleRecord | null,
): HolidayModuleFormValue {
  if (!record) return defaultHolidayModuleFormValue();
  return {
    name: String(record.name ?? ''),
    moduleType: String(record.moduleType ?? 'custom'),
    calendarYear: record.calendarYear ? String(record.calendarYear) : '',
    branchId: String(record.branchId ?? ''),
    departmentIds: Array.isArray(record.departmentIds) ? record.departmentIds : [],
    description: String(record.description ?? ''),
    status: String(record.status ?? 'active'),
  };
}

export function holidayModuleFormToPayload(value: HolidayModuleFormValue): Record<string, unknown> {
  return {
    name: value.name.trim(),
    moduleType: value.moduleType,
    calendarYear: value.calendarYear ? Number(value.calendarYear) : undefined,
    branchId: value.branchId || undefined,
    departmentIds: value.departmentIds,
    description: value.description.trim() || undefined,
    status: value.status,
  };
}

interface HolidayModuleFormProps {
  value: HolidayModuleFormValue;
  onChange: (value: HolidayModuleFormValue) => void;
}

export function HolidayModuleForm({ value, onChange }: HolidayModuleFormProps) {
  const { data: departments } = useMasterDataList('department', {
    pageSize: 200,
    status: 'active',
  });
  const departmentMap = useMemo(
    () => new Map((departments?.items ?? []).map((dept) => [dept.id, dept.name])),
    [departments?.items],
  );

  function update<K extends keyof HolidayModuleFormValue>(key: K, next: HolidayModuleFormValue[K]) {
    onChange({ ...value, [key]: next });
  }

  function toggleDepartment(departmentId: string) {
    const exists = value.departmentIds.includes(departmentId);
    update(
      'departmentIds',
      exists
        ? value.departmentIds.filter((id) => id !== departmentId)
        : [...value.departmentIds, departmentId],
    );
  }

  return (
    <div className="space-y-4">
      <FormSection title="Module Details">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Module Name" htmlFor="module-name" required>
            <Input
              id="module-name"
              value={value.name}
              required
              placeholder="e.g. India National Holidays 2026"
              onChange={(event) => update('name', event.target.value)}
            />
          </SelectField>
          <SelectField label="Module Type" htmlFor="module-type" required>
            <select
              id="module-type"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={value.moduleType}
              onChange={(event) => update('moduleType', event.target.value)}
            >
              {HOLIDAY_MODULE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SelectField>
          <SelectField label="Calendar Year" htmlFor="module-year">
            <Input
              id="module-year"
              type="number"
              min={2000}
              max={2100}
              value={value.calendarYear}
              placeholder="2026"
              onChange={(event) => update('calendarYear', event.target.value)}
            />
          </SelectField>
          <SelectField label="Branch Scope" htmlFor="module-branch">
            <MasterDataSelect
              id="module-branch"
              entityKey="branch"
              value={value.branchId}
              onChange={(next) => update('branchId', next)}
              placeholder="All branches (optional)"
            />
          </SelectField>
          <SelectField label="Status" htmlFor="module-status">
            <select
              id="module-status"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={value.status}
              onChange={(event) => update('status', event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </SelectField>
          <div className="sm:col-span-2">
            <SelectField label="Description" htmlFor="module-description">
              <textarea
                id="module-description"
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={value.description}
                placeholder="Describe festivals, weekly offs, or regional rules in this module"
                onChange={(event) => update('description', event.target.value)}
              />
            </SelectField>
          </div>
        </div>
      </FormSection>

      <FormSection title="Department Assignment">
        <p className="mb-3 text-sm text-muted-foreground">
          Leave empty to apply company-wide. Selected departments inherit all holidays in this
          module.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {value.departmentIds.length === 0 ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs">All departments</span>
          ) : (
            value.departmentIds.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => toggleDepartment(id)}
              >
                {departmentMap.get(id) ?? id} ×
              </Button>
            ))
          )}
        </div>
        <MasterDataSelect
          entityKey="department"
          value=""
          onChange={(departmentId) => {
            if (departmentId && !value.departmentIds.includes(departmentId)) {
              toggleDepartment(departmentId);
            }
          }}
          placeholder="Add department…"
        />
      </FormSection>
    </div>
  );
}
