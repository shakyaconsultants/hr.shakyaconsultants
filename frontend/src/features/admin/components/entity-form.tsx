import { useMemo } from 'react';
import type { EntityFieldDefinition } from '@/features/admin/constants/entity-fields';
import type { MasterDataRecord } from '@/features/organization/api/organization.api';
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

export interface EntityFormProps {
  fields: EntityFieldDefinition[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  referenceOptions?: Record<string, Array<{ value: string; label: string }>>;
}

export function EntityForm({ fields, value, onChange, referenceOptions = {} }: EntityFormProps) {
  function updateField(key: string, fieldValue: unknown) {
    onChange(setNestedValue(value, key, fieldValue));
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const raw = getNestedValue(value, field.key);
        const fieldId = `field-${field.key}`;

        if (field.type === 'textarea') {
          return (
            <label key={field.key} className="col-span-full block space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">{field.label}</span>
              <textarea
                id={fieldId}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={String(raw ?? '')}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          );
        }

        if (field.type === 'select') {
          const options = field.refEntity ? referenceOptions[field.refEntity] ?? [] : field.options ?? [];
          return (
            <label key={field.key} className="block space-y-1 text-sm">
              <span className="font-medium">{field.label}</span>
              <select
                id={fieldId}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={String(raw ?? '')}
                onChange={(event) => updateField(field.key, event.target.value || undefined)}
              >
                <option value="">— Select —</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.type === 'boolean') {
          return (
            <label key={field.key} className="flex items-center gap-2 text-sm">
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
          <label key={field.key} className="block space-y-1 text-sm">
            <span className="font-medium">{field.label}</span>
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
          </label>
        );
      })}
    </div>
  );
}

export function recordToFormValue(record: MasterDataRecord | null, fields: EntityFieldDefinition[]): Record<string, unknown> {
  if (!record) {
    return { status: 'active' };
  }
  const value: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = getNestedValue(record, field.key);
    if (raw !== undefined) {
      Object.assign(value, setNestedValue(value, field.key, raw));
    }
  }
  if (Array.isArray(record.responsibilities)) {
    value.responsibilities = (record.responsibilities as string[]).join(', ');
  }
  return value;
}

export function formValueToPayload(value: Record<string, unknown>, _fields: EntityFieldDefinition[]): Record<string, unknown> {
  const payload = { ...value };
  if (typeof payload.code === 'string') {
    payload.code = payload.code.toUpperCase();
  }
  if (typeof payload.responsibilities === 'string') {
    payload.responsibilities = payload.responsibilities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return payload;
}

export function useReferenceOptions(
  fields: EntityFieldDefinition[],
  lists: Partial<Record<string, MasterDataRecord[]>>,
): Record<string, Array<{ value: string; label: string }>> {
  return useMemo(() => {
    const options: Record<string, Array<{ value: string; label: string }>> = {};
    for (const field of fields) {
      if (!field.refEntity) {
        continue;
      }
      const items = lists[field.refEntity] ?? [];
      options[field.refEntity] = items.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.code})`,
      }));
    }
    return options;
  }, [fields, lists]);
}
