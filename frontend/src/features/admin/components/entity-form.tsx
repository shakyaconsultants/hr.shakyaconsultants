import { useMemo } from 'react';
import type { EntityFieldDefinition } from '@/features/admin/constants/entity-fields';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import type { MasterDataRecord } from '@/features/organization/api/organization.api';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { EmployeeSearchSelect } from '@/shared/components/employee-search-select';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { Input } from '@/shared/components/ui/input';

function getNestedValue(record: Record<string, unknown>, key: string): unknown {
  if (!key.includes('.')) {
    return record[key];
  }
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, record);
}

function setNestedValue(record: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  if (!key.includes('.')) {
    return { ...record, [key]: value };
  }
  const [head, ...rest] = key.split('.');
  const nested = (record[head] as Record<string, unknown> | undefined) ?? {};
  return {
    ...record,
    [head]: setNestedValue(nested, rest.join('.'), value),
  };
}

function classifyField(field: EntityFieldDefinition): keyof typeof FORM_SECTIONS {
  if (['name', 'description', 'status'].includes(field.key)) {
    return 'BASIC';
  }
  if (field.refEntity || field.key.endsWith('Id')) {
    return 'RELATIONSHIPS';
  }
  if (field.key.startsWith('address.')) {
    return 'ADDITIONAL';
  }
  if (field.type === 'textarea' && field.key !== 'description') {
    return 'ADDITIONAL';
  }
  return 'BUSINESS';
}

export interface EntityFormProps {
  fields: EntityFieldDefinition[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function EntityFieldInput({
  field,
  raw,
  fieldId,
  updateField,
}: {
  field: EntityFieldDefinition;
  raw: unknown;
  fieldId: string;
  updateField: (key: string, fieldValue: unknown) => void;
}) {
  if (field.key === 'headEmployeeId') {
    return (
      <SelectField label={field.label} htmlFor={fieldId} required={field.required}>
        <EmployeeSearchSelect
          id={fieldId}
          value={String(raw ?? '')}
          onChange={(next) => updateField(field.key, next || undefined)}
          required={field.required}
        />
      </SelectField>
    );
  }

  if (field.type === 'textarea') {
    return (
      <SelectField label={field.label} htmlFor={fieldId} required={field.required}>
        <textarea
          id={fieldId}
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={String(raw ?? '')}
          placeholder={field.placeholder}
          onChange={(event) => updateField(field.key, event.target.value)}
        />
      </SelectField>
    );
  }

  if (field.type === 'select') {
    if (field.refEntity) {
      return (
        <SelectField label={field.label} htmlFor={fieldId} required={field.required}>
          <MasterDataSelect
            id={fieldId}
            entityKey={field.refEntity as MasterEntityKey}
            value={String(raw ?? '')}
            placeholder={`Select ${field.label.toLowerCase()}…`}
            onChange={(next) => updateField(field.key, next || undefined)}
            required={field.required}
          />
        </SelectField>
      );
    }

    const options = (field.options ?? []).map((option) => ({
      value: option.value,
      label: option.label,
    }));

    return (
      <SelectField label={field.label} htmlFor={fieldId} required={field.required}>
        <AsyncSearchSelect
          id={fieldId}
          value={String(raw ?? '')}
          options={options}
          placeholder={`Select ${field.label.toLowerCase()}…`}
          onChange={(next) => updateField(field.key, next || undefined)}
          required={field.required}
          clearable={!field.required}
        />
      </SelectField>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm">
        <input
          id={fieldId}
          type="checkbox"
          checked={Boolean(raw)}
          onChange={(event) => updateField(field.key, event.target.checked)}
        />
        <span className="font-medium">{field.label}</span>
      </label>
    );
  }

  return (
    <SelectField label={field.label} htmlFor={fieldId} required={field.required} hint={field.placeholder}>
      <Input
        id={fieldId}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={String(raw ?? '')}
        required={field.required}
        placeholder={field.placeholder}
        onChange={(event) => {
          const next =
            field.type === 'number'
              ? event.target.value === ''
                ? undefined
                : Number(event.target.value)
              : event.target.value;
          updateField(field.key, next);
        }}
      />
    </SelectField>
  );
}

export function EntityForm({ fields, value, onChange }: EntityFormProps) {
  function updateField(key: string, fieldValue: unknown) {
    onChange(setNestedValue(value, key, fieldValue));
  }

  const grouped = useMemo(() => {
    const sections: Record<string, EntityFieldDefinition[]> = {
      [FORM_SECTIONS.BASIC]: [],
      [FORM_SECTIONS.RELATIONSHIPS]: [],
      [FORM_SECTIONS.BUSINESS]: [],
      [FORM_SECTIONS.ADDITIONAL]: [],
    };

    for (const field of fields) {
      const sectionKey = FORM_SECTIONS[classifyField(field)];
      sections[sectionKey].push(field);
    }

    return sections;
  }, [fields]);

  return (
    <div className="space-y-4">
      {(Object.entries(grouped) as Array<[string, EntityFieldDefinition[]]>).map(([title, sectionFields]) =>
        sectionFields.length === 0 ? null : (
          <FormSection key={title} title={title}>
            <div className="grid gap-3 sm:grid-cols-2">
              {sectionFields.map((field) => {
                const raw = getNestedValue(value, field.key);
                const fieldId = `field-${field.key}`;
                const isFullWidth = field.type === 'textarea' || field.key.startsWith('address.');

                return (
                  <div key={field.key} className={isFullWidth ? 'sm:col-span-2' : undefined}>
                    <EntityFieldInput field={field} raw={raw} fieldId={fieldId} updateField={updateField} />
                  </div>
                );
              })}
            </div>
          </FormSection>
        ),
      )}
    </div>
  );
}

export function recordToFormValue(record: MasterDataRecord | null, fields: EntityFieldDefinition[]): Record<string, unknown> {
  if (!record) {
    return { status: 'active' };
  }
  const formValue: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = getNestedValue(record, field.key);
    if (raw !== undefined) {
      Object.assign(formValue, setNestedValue(formValue, field.key, raw));
    }
  }
  if (Array.isArray(record.responsibilities)) {
    formValue.responsibilities = (record.responsibilities as string[]).join(', ');
  }
  return formValue;
}

export function formValueToPayload(value: Record<string, unknown>, _fields: EntityFieldDefinition[]): Record<string, unknown> {
  const payload = { ...value };
  delete payload.code;
  if (typeof payload.responsibilities === 'string') {
    payload.responsibilities = payload.responsibilities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return payload;
}
