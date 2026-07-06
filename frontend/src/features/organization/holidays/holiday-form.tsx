import { FormSection } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { DatePicker } from '@/shared/components/date-picker';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { Input } from '@/shared/components/ui/input';
import type { HolidayRecord } from '@/features/organization/holidays/holiday.api';
import {
  HOLIDAY_SCHEDULE_MODES,
  HOLIDAY_TYPES,
  type HolidayScheduleMode,
} from '@/features/organization/holidays/holiday.constants';
import { WEEKDAY_OPTIONS } from '@/features/organization/holidays/holiday-module.constants';
import { toDateInputValue } from '@/shared/utils/datetime';

export interface HolidayFormValue {
  name: string;
  date: string;
  type: string;
  holidayModuleId: string;
  branchId: string;
  dayOfWeek: string;
  description: string;
  status: string;
  isRecurring: boolean;
  recurrenceRule: string;
  isOptional: boolean;
  scheduleMode: HolidayScheduleMode;
}

function dayOfWeekFromDate(date: string): string {
  if (!date) return '0';
  return String(new Date(`${date}T00:00:00`).getDay());
}

function inferScheduleMode(record: HolidayRecord): HolidayScheduleMode {
  if (record.type === 'weekly') {
    return 'every_week';
  }
  if (record.isRecurring && record.recurrenceRule === 'yearly') {
    return 'every_year';
  }
  return 'once';
}

export function defaultHolidayFormValue(date?: string, moduleId?: string): HolidayFormValue {
  return {
    name: '',
    date: date ?? '',
    type: 'public',
    holidayModuleId: moduleId ?? '',
    branchId: '',
    dayOfWeek: dayOfWeekFromDate(date ?? ''),
    description: '',
    status: 'active',
    isRecurring: false,
    recurrenceRule: '',
    isOptional: false,
    scheduleMode: 'once',
  };
}

export function recordToHolidayForm(record: HolidayRecord | null): HolidayFormValue {
  if (!record) return defaultHolidayFormValue();
  const scheduleMode = inferScheduleMode(record);
  return {
    name: String(record.name ?? ''),
    date: record.date ? toDateInputValue(String(record.date)) : '',
    type: String(record.type ?? 'public'),
    holidayModuleId: String(record.holidayModuleId ?? ''),
    branchId: String(record.branchId ?? ''),
    dayOfWeek: record.dayOfWeek !== undefined ? String(record.dayOfWeek) : '0',
    description: String(record.description ?? ''),
    status: String(record.status ?? 'active'),
    isRecurring: Boolean(record.isRecurring),
    recurrenceRule: String(record.recurrenceRule ?? ''),
    isOptional: Boolean(record.isOptional),
    scheduleMode,
  };
}

export function holidayFormToPayload(value: HolidayFormValue): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: value.name.trim(),
    status: value.status,
    isOptional: value.isOptional || value.type === 'optional',
    description: value.description.trim() || undefined,
    holidayModuleId: value.holidayModuleId,
  };

  if (value.scheduleMode === 'every_week') {
    payload.type = 'weekly';
    payload.dayOfWeek = Number(value.dayOfWeek);
    payload.isRecurring = true;
    payload.recurrenceRule = 'weekly';
    return payload;
  }

  payload.type = value.type === 'weekly' ? 'public' : value.type;

  if (value.date) {
    payload.date = new Date(`${value.date}T00:00:00`).toISOString();
  }

  if (value.scheduleMode === 'every_year') {
    payload.isRecurring = true;
    payload.recurrenceRule = 'yearly';
  } else {
    payload.isRecurring = false;
    payload.recurrenceRule = undefined;
  }

  if (value.type === 'branch' && value.branchId) {
    payload.branchId = value.branchId;
  } else {
    payload.branchId = undefined;
  }

  return payload;
}

interface HolidayFormProps {
  value: HolidayFormValue;
  onChange: (value: HolidayFormValue) => void;
  moduleId?: string;
  moduleName?: string;
}

export function HolidayForm({ value, onChange, moduleId, moduleName }: HolidayFormProps) {
  const lockedModuleId = moduleId ?? value.holidayModuleId;

  function update<K extends keyof HolidayFormValue>(key: K, next: HolidayFormValue[K]) {
    onChange({ ...value, [key]: next });
  }

  function updateScheduleMode(mode: HolidayScheduleMode) {
    const next: HolidayFormValue = { ...value, scheduleMode: mode };
    if (mode === 'every_week') {
      next.dayOfWeek = value.date ? dayOfWeekFromDate(value.date) : value.dayOfWeek;
      next.type = 'weekly';
    } else if (mode === 'every_year') {
      next.isRecurring = true;
      next.recurrenceRule = 'yearly';
      if (next.type === 'weekly') next.type = 'festival';
    } else {
      next.isRecurring = false;
      next.recurrenceRule = '';
      if (next.type === 'weekly') next.type = 'public';
    }
    onChange(next);
  }

  const isWeeklySchedule = value.scheduleMode === 'every_week';

  return (
    <div className="space-y-4">
      {lockedModuleId ? (
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Module: </span>
          <span className="font-medium">{moduleName ?? 'Selected module'}</span>
        </div>
      ) : (
        <FormSection title="Module">
          <SelectField label="Holiday Module" htmlFor="holiday-module" required>
            <MasterDataSelect
              id="holiday-module"
              entityKey="holiday-module"
              value={value.holidayModuleId}
              onChange={(next) => update('holidayModuleId', next)}
              placeholder="Select module (required)"
              required
            />
          </SelectField>
        </FormSection>
      )}

      <FormSection title="Schedule">
        <p className="mb-3 text-sm text-muted-foreground">
          Choose how this holiday repeats — like scheduling on a company calendar.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {HOLIDAY_SCHEDULE_MODES.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 text-sm transition-colors ${
                value.scheduleMode === option.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'hover:bg-muted/40'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="schedule-mode"
                  checked={value.scheduleMode === option.value}
                  onChange={() => updateScheduleMode(option.value)}
                />
                {option.label}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">{option.description}</span>
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection title="Holiday Details">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Holiday Name" htmlFor="holiday-name" required>
            <Input
              id="holiday-name"
              value={value.name}
              required
              placeholder="e.g. Diwali, Republic Day, Saturday Off"
              onChange={(event) => update('name', event.target.value)}
            />
          </SelectField>

          {!isWeeklySchedule ? (
            <SelectField label="Holiday Type" htmlFor="holiday-type" required>
              <select
                id="holiday-type"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={value.type}
                onChange={(event) => update('type', event.target.value)}
              >
                {HOLIDAY_TYPES.filter((option) => option.value !== 'weekly').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SelectField>
          ) : null}

          {isWeeklySchedule ? (
            <SelectField label="Weekly Off Day" htmlFor="holiday-dow" required>
              <select
                id="holiday-dow"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={value.dayOfWeek}
                onChange={(event) => update('dayOfWeek', event.target.value)}
              >
                {WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SelectField>
          ) : (
            <SelectField label="Date" htmlFor="holiday-date" required>
              <DatePicker value={value.date} onChange={(next) => update('date', next)} required />
            </SelectField>
          )}

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

          {value.type === 'branch' && !isWeeklySchedule ? (
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

          {!isWeeklySchedule ? (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={value.isOptional}
                onChange={(event) => update('isOptional', event.target.checked)}
              />
              <span>Employees may choose to work (optional / restricted holiday)</span>
            </label>
          ) : null}
        </div>
      </FormSection>
    </div>
  );
}
