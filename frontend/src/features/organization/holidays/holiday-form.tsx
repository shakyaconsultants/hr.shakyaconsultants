import { FormSection } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { DatePicker } from '@/shared/components/date-picker';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { Input } from '@/shared/components/ui/input';
import type { HolidayRecord } from '@/features/organization/holidays/holiday.api';
import { HOLIDAY_TYPES, RECURRENCE_OPTIONS } from '@/features/organization/holidays/holiday.constants';
import { toDateInputValue } from '@/shared/utils/datetime';

export interface HolidayFormValue {
  name: string;
  date: string;
  type: string;
  branchId: string;
  description: string;
  status: string;
  isRecurring: boolean;
  recurrenceRule: string;
  isOptional: boolean;
}

export function defaultHolidayFormValue(date?: string): HolidayFormValue {
  return {
    name: '',
    date: date ?? '',
    type: 'public',
    branchId: '',
    description: '',
    status: 'active',
    isRecurring: false,
    recurrenceRule: '',
    isOptional: false,
  };
}

export function recordToHolidayForm(record: HolidayRecord | null): HolidayFormValue {
  if (!record) return defaultHolidayFormValue();
  return {
    name: String(record.name ?? ''),
    date: record.date ? toDateInputValue(String(record.date)) : '',
    type: String(record.type ?? 'public'),
    branchId: String(record.branchId ?? ''),
    description: String(record.description ?? ''),
    status: String(record.status ?? 'active'),
    isRecurring: Boolean(record.isRecurring),
    recurrenceRule: String(record.recurrenceRule ?? ''),
    isOptional: Boolean(record.isOptional),
  };
}

export function holidayFormToPayload(value: HolidayFormValue): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: value.name.trim(),
    type: value.type,
    status: value.status,
    isRecurring: value.isRecurring,
    isOptional: value.isOptional || value.type === 'optional',
    description: value.description.trim() || undefined,
  };

  if (value.date) {
    payload.date = new Date(`${value.date}T00:00:00`).toISOString();
  }

  if (value.type === 'branch' && value.branchId) {
    payload.branchId = value.branchId;
  } else {
    payload.branchId = undefined;
  }

  if (value.isRecurring && value.recurrenceRule) {
    payload.recurrenceRule = value.recurrenceRule;
  } else {
    payload.recurrenceRule = undefined;
  }

  return payload;
}

interface HolidayFormProps {
  value: HolidayFormValue;
  onChange: (value: HolidayFormValue) => void;
}

export function HolidayForm({ value, onChange }: HolidayFormProps) {
  function update<K extends keyof HolidayFormValue>(key: K, next: HolidayFormValue[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-4">
      <FormSection title="Holiday Details">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Holiday Name" htmlFor="holiday-name" required>
            <Input
              id="holiday-name"
              value={value.name}
              required
              placeholder="e.g. Independence Day"
              onChange={(event) => update('name', event.target.value)}
            />
          </SelectField>
          <SelectField label="Date" htmlFor="holiday-date" required>
            <DatePicker value={value.date} onChange={(next) => update('date', next)} required />
          </SelectField>
          <SelectField label="Holiday Type" htmlFor="holiday-type" required>
            <select
              id="holiday-type"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={value.type}
              onChange={(event) => update('type', event.target.value)}
            >
              {HOLIDAY_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SelectField>
          <SelectField label="Status" htmlFor="holiday-status">
            <select
              id="holiday-status"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={value.status}
              onChange={(event) => update('status', event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </SelectField>
          {value.type === 'branch' ? (
            <SelectField label="Branch" htmlFor="holiday-branch" required>
              <MasterDataSelect
                id="holiday-branch"
                entityKey="branch"
                value={value.branchId}
                onChange={(next) => update('branchId', next)}
                placeholder="Select branch…"
                required
              />
            </SelectField>
          ) : null}
          <div className="sm:col-span-2">
            <SelectField label="Description" htmlFor="holiday-description">
              <textarea
                id="holiday-description"
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={value.description}
                placeholder="Notes for HR, payroll, or attendance teams"
                onChange={(event) => update('description', event.target.value)}
              />
            </SelectField>
          </div>
        </div>
      </FormSection>

      <FormSection title="Recurrence & Policy">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={value.isOptional}
              onChange={(event) => update('isOptional', event.target.checked)}
            />
            <span>Employees may choose to work (optional / restricted holiday)</span>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={value.isRecurring}
              onChange={(event) => update('isRecurring', event.target.checked)}
            />
            <span>Recurring holiday</span>
          </label>
          {value.isRecurring ? (
            <SelectField label="Recurrence" htmlFor="holiday-recurrence">
              <select
                id="holiday-recurrence"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={value.recurrenceRule}
                onChange={(event) => update('recurrenceRule', event.target.value)}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SelectField>
          ) : null}
        </div>
      </FormSection>
    </div>
  );
}
