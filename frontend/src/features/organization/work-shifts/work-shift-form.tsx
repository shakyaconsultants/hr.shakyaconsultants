import { useMemo } from 'react';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { DurationInput } from '@/shared/components/duration-input';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { TimePicker, validateEndAfterStart } from '@/shared/components/time-picker';
import { Input } from '@/shared/components/ui/input';
import type { MasterDataRecord } from '@/features/organization/api/organization.api';
import {
  calculateWorkingMinutes,
  formatDurationMinutes,
  isValidTimeInput,
} from '@/shared/utils/datetime';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export interface WorkShiftFormValue {
  name: string;
  description?: string;
  status: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes?: number;
  breakMinutes?: number;
  weeklyOffDays: number[];
  isNightShift: boolean;
  isFlexible: boolean;
  lateMarkAfterMinutes?: number;
  halfDayAfterMinutes?: number;
  overtimeAllowed: boolean;
}

interface WorkShiftFormProps {
  value: WorkShiftFormValue;
  onChange: (value: WorkShiftFormValue) => void;
}

export function defaultWorkShiftFormValue(): WorkShiftFormValue {
  return {
    name: '',
    status: 'active',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 10,
    breakMinutes: 60,
    weeklyOffDays: [0, 6],
    isNightShift: false,
    isFlexible: false,
    lateMarkAfterMinutes: 15,
    halfDayAfterMinutes: 240,
    overtimeAllowed: true,
  };
}

export function recordToWorkShiftForm(record: MasterDataRecord | null): WorkShiftFormValue {
  if (!record) return defaultWorkShiftFormValue();

  const rules = (record.attendanceRules as Record<string, unknown> | undefined) ?? {};

  return {
    name: String(record.name ?? ''),
    description: typeof record.description === 'string' ? record.description : undefined,
    status: String(record.status ?? 'active'),
    startTime: String(record.startTime ?? '09:00'),
    endTime: String(record.endTime ?? '18:00'),
    gracePeriodMinutes: typeof record.gracePeriodMinutes === 'number' ? record.gracePeriodMinutes : 0,
    breakMinutes: typeof record.breakMinutes === 'number' ? record.breakMinutes : 0,
    weeklyOffDays: Array.isArray(record.weeklyOffDays) ? (record.weeklyOffDays as number[]) : [0, 6],
    isNightShift: Boolean(record.isNightShift),
    isFlexible: Boolean(record.isFlexible),
    lateMarkAfterMinutes: typeof rules.lateMarkAfterMinutes === 'number' ? rules.lateMarkAfterMinutes : 15,
    halfDayAfterMinutes: typeof rules.halfDayAfterMinutes === 'number' ? rules.halfDayAfterMinutes : 240,
    overtimeAllowed: rules.overtimeAllowed !== false,
  };
}

export function workShiftFormToPayload(value: WorkShiftFormValue): Record<string, unknown> {
  const workingDays = WEEKDAYS.map((day) => day.value).filter((day) => !value.weeklyOffDays.includes(day));

  return {
    name: value.name.trim(),
    status: value.status,
    startTime: value.startTime,
    endTime: value.endTime,
    gracePeriodMinutes: value.gracePeriodMinutes ?? 0,
    breakMinutes: value.breakMinutes ?? 0,
    weeklyOffDays: value.weeklyOffDays,
    daysOfWeek: workingDays,
    isNightShift: value.isNightShift,
    isFlexible: value.isFlexible,
    attendanceRules: {
      lateMarkAfterMinutes: value.lateMarkAfterMinutes ?? 0,
      halfDayAfterMinutes: value.halfDayAfterMinutes ?? 0,
      overtimeAllowed: value.overtimeAllowed,
    },
  };
}

function WeeklyOffMultiSelect({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  function toggleDay(day: number) {
    if (selected.includes(day)) {
      onChange(selected.filter((value) => value !== day));
      return;
    }
    onChange([...selected, day].sort());
  }

  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAYS.map((day) => (
        <label key={day.value} className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm">
          <input type="checkbox" checked={selected.includes(day.value)} onChange={() => toggleDay(day.value)} />
          {day.label}
        </label>
      ))}
    </div>
  );
}

export function WorkShiftForm({ value, onChange }: WorkShiftFormProps) {
  const scheduleError = useMemo(() => {
    if (!isValidTimeInput(value.startTime) || !isValidTimeInput(value.endTime)) return undefined;
    return validateEndAfterStart(value.startTime, value.endTime, value.isNightShift);
  }, [value.endTime, value.isNightShift, value.startTime]);

  const workingMinutes = useMemo(
    () =>
      calculateWorkingMinutes(
        value.startTime,
        value.endTime,
        value.breakMinutes ?? 0,
        value.isNightShift,
      ),
    [value.breakMinutes, value.endTime, value.isNightShift, value.startTime],
  );

  return (
    <div className="space-y-4">
      <FormSection title={FORM_SECTIONS.BASIC} description="Shift identity and availability.">
        <SelectField label="Shift Name" required>
          <Input
            value={value.name}
            required
            placeholder="e.g. General Shift"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
          />
        </SelectField>

        <SelectField label="Description">
          <textarea
            className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value.description ?? ''}
            placeholder="Optional shift notes for administrators"
            onChange={(event) => onChange({ ...value, description: event.target.value })}
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
      </FormSection>

      <FormSection title="Schedule" description="Working window, breaks, and weekly offs.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Start Time" required>
            <TimePicker
              value={value.startTime}
              onChange={(next) => onChange({ ...value, startTime: next })}
              required
            />
          </SelectField>
          <SelectField label="End Time" required error={scheduleError}>
            <TimePicker
              value={value.endTime}
              onChange={(next) => onChange({ ...value, endTime: next })}
              required
              error={scheduleError}
            />
          </SelectField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Grace Minutes">
            <DurationInput
              value={value.gracePeriodMinutes}
              onChange={(next) => onChange({ ...value, gracePeriodMinutes: next })}
              min={0}
              max={180}
            />
          </SelectField>
          <SelectField label="Break Duration (Minutes)">
            <DurationInput
              value={value.breakMinutes}
              onChange={(next) => onChange({ ...value, breakMinutes: next })}
              min={0}
              max={480}
            />
          </SelectField>
        </div>

        <div className="rounded-md border bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">Working Hours</span>
          <p className="font-medium">
            {workingMinutes === null ? '—' : formatDurationMinutes(workingMinutes)}
            <span className="ml-2 text-xs font-normal text-muted-foreground">Auto-calculated</span>
          </p>
        </div>

        <SelectField label="Weekly Off">
          <WeeklyOffMultiSelect
            selected={value.weeklyOffDays}
            onChange={(days) => onChange({ ...value, weeklyOffDays: days })}
          />
        </SelectField>

        <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={value.isNightShift}
            onChange={(event) => onChange({ ...value, isNightShift: event.target.checked })}
          />
          Overnight shift
        </label>
      </FormSection>

      <FormSection title="Rules" description="Attendance thresholds and flexibility.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Late Mark After (Minutes)">
            <DurationInput
              value={value.lateMarkAfterMinutes}
              onChange={(next) => onChange({ ...value, lateMarkAfterMinutes: next })}
              min={0}
              max={240}
            />
          </SelectField>
          <SelectField label="Half Day After (Minutes)">
            <DurationInput
              value={value.halfDayAfterMinutes}
              onChange={(next) => onChange({ ...value, halfDayAfterMinutes: next })}
              min={0}
              max={720}
            />
          </SelectField>
        </div>

        <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={value.overtimeAllowed}
            onChange={(event) => onChange({ ...value, overtimeAllowed: event.target.checked })}
          />
          Overtime allowed
        </label>

        <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={value.isFlexible}
            onChange={(event) => onChange({ ...value, isFlexible: event.target.checked })}
          />
          Flexible shift
        </label>
      </FormSection>
    </div>
  );
}
