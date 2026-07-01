import { useMemo } from 'react';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { AsyncMultiSearchSelect } from '@/shared/components/async-multi-search-select';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { Input } from '@/shared/components/ui/input';
import {
  DESIGNATION_HIERARCHY_LEVELS,
} from '@/features/organization/designations/designation.constants';
import type { DesignationRecord } from '@/features/organization/designations/designation.api';

export interface DesignationFormValue {
  name: string;
  description?: string;
  hierarchyLevel?: number;
  departmentIds?: string[];
  salaryGradeId?: string;
  promotionDesignationId?: string;
  status: string;
}

interface DesignationFormProps {
  value: DesignationFormValue;
  onChange: (value: DesignationFormValue) => void;
  excludeDesignationId?: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function recordToDesignationForm(record: DesignationRecord | null): DesignationFormValue {
  if (!record) {
    return { name: '', status: 'active', departmentIds: [] };
  }

  return {
    name: record.name,
    description: typeof record.description === 'string' ? record.description : undefined,
    hierarchyLevel: typeof record.hierarchyLevel === 'number' ? record.hierarchyLevel : undefined,
    departmentIds: Array.isArray(record.departmentIds) ? record.departmentIds : [],
    salaryGradeId: record.salaryGradeId,
    promotionDesignationId: record.promotionDesignationId,
    status: record.status ?? 'active',
  };
}

export function designationFormToPayload(value: DesignationFormValue): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: value.name.trim(),
    status: value.status,
    departmentIds: value.departmentIds ?? [],
  };

  if (value.description?.trim()) payload.description = value.description.trim();
  if (value.hierarchyLevel !== undefined) payload.hierarchyLevel = value.hierarchyLevel;
  if (value.salaryGradeId) payload.salaryGradeId = value.salaryGradeId;
  if (value.promotionDesignationId) payload.promotionDesignationId = value.promotionDesignationId;

  return payload;
}

export function DesignationForm({ value, onChange, excludeDesignationId }: DesignationFormProps) {
  const { data: designationOptions, isLoading: isLoadingDesignations } = useMasterDataList('designation', {
    page: 1,
    pageSize: 100,
    status: 'active',
  });
  const { data: departmentData, isLoading: isLoadingDepartments } = useMasterDataList('department', {
    page: 1,
    pageSize: 100,
    status: 'active',
  });

  const hierarchyOptions = useMemo(
    () =>
      DESIGNATION_HIERARCHY_LEVELS.map((level) => ({
        value: String(level.value),
        label: `${level.value} — ${level.label}`,
      })),
    [],
  );

  const promotionOptions = useMemo(
    () =>
      (designationOptions?.items ?? [])
        .filter((item) => item.id !== excludeDesignationId)
        .map((designation) => ({
          value: designation.id,
          label: String(designation.name),
          description: designation.code ? String(designation.code) : undefined,
        })),
    [designationOptions?.items, excludeDesignationId],
  );

  const departmentOptions = useMemo(
    () =>
      (departmentData?.items ?? []).map((dept) => ({
        value: dept.id,
        label: String(dept.name),
        description: dept.code ? String(dept.code) : undefined,
      })),
    [departmentData?.items],
  );



  return (
    <div className="space-y-4">
      <FormSection title={FORM_SECTIONS.BASIC} description="Title, hierarchy level, and lifecycle status.">
        <SelectField label="Designation Name" required>
          <Input
            value={value.name}
            required
            placeholder="e.g. Senior"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
          />
        </SelectField>

        <SelectField label="Hierarchy Level" required>
          <AsyncSearchSelect
            value={value.hierarchyLevel !== undefined ? String(value.hierarchyLevel) : ''}
            options={hierarchyOptions}
            placeholder="Select level…"
            onChange={(next) =>
              onChange({
                ...value,
                hierarchyLevel: next ? Number(next) : undefined,
              })
            }
            clearable={false}
          />
        </SelectField>

        <SelectField label="Status">
          <AsyncSearchSelect
            value={value.status}
            options={STATUS_OPTIONS}
            onChange={(next) => onChange({ ...value, status: next })}
            clearable={false}
          />
        </SelectField>

        <SelectField label="Description">
          <textarea
            className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value.description ?? ''}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
          />
        </SelectField>
      </FormSection>

      <FormSection title={FORM_SECTIONS.RELATIONSHIPS} description="Department mapping and job role applicability.">
        <SelectField label="Applicable Departments">
          <AsyncMultiSearchSelect
            value={value.departmentIds ?? []}
            options={departmentOptions}
            isLoading={isLoadingDepartments}
            placeholder="Select departments…"
            onChange={(ids) => onChange({ ...value, departmentIds: ids })}
          />
        </SelectField>



        <SelectField label="Promotion Path">
          <AsyncSearchSelect
            value={value.promotionDesignationId ?? ''}
            options={promotionOptions}
            isLoading={isLoadingDesignations}
            placeholder="No promotion path"
            onChange={(next) => onChange({ ...value, promotionDesignationId: next || undefined })}
          />
        </SelectField>
      </FormSection>

      <FormSection title={FORM_SECTIONS.BUSINESS} description="Compensation band and composed titles.">
        <SelectField label="Salary Grade">
          <MasterDataSelect
            entityKey="salary-grade"
            value={value.salaryGradeId ?? ''}
            placeholder="Select salary grade…"
            onChange={(next) => onChange({ ...value, salaryGradeId: next || undefined })}
          />
        </SelectField>


      </FormSection>
    </div>
  );
}
