import { useId, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { DatePicker } from '@/shared/components/date-picker';
import { TimePicker } from '@/shared/components/time-picker';
import { useTimeFormat } from '@/shared/hooks/use-time-format';
import {
  formatDateTimeDisplay,
  isValidDateInput,
  isValidTimeInput,
  toDateInputValue,
  toDateTimeLocalValue,
} from '@/shared/utils/datetime';

export interface DateTimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  minuteStep?: number;
  className?: string;
  error?: string;
}

function splitDateTimeValue(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  if (value.includes('T')) {
    const [date, timePart] = value.split('T');
    return { date: date ?? '', time: (timePart ?? '').slice(0, 5) };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
  return {
    date: toDateInputValue(parsed),
    time: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
  };
}

function combineDateTime(date: string, time: string): string {
  if (!date && !time) return '';
  if (!date) return '';
  const safeTime = isValidTimeInput(time) ? time : '00:00';
  return `${date}T${safeTime}`;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = 'Select date and time…',
  min,
  max,
  disabled,
  required,
  clearable = true,
  minuteStep = 15,
  className,
  error,
}: DateTimePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const timeFormat = useTimeFormat();
  const [expanded, setExpanded] = useState(false);

  const { date, time } = useMemo(() => splitDateTimeValue(value), [value]);
  const minParts = useMemo(() => splitDateTimeValue(min ?? ''), [min]);
  const maxParts = useMemo(() => splitDateTimeValue(max ?? ''), [max]);

  const displayValue =
    value && (isValidDateInput(date) || time)
      ? formatDateTimeDisplay(toDateTimeLocalValue(new Date(combineDateTime(date, time || '00:00'))), timeFormat)
      : placeholder;

  function updateDate(nextDate: string) {
    onChange(combineDateTime(nextDate, time || '09:00'));
  }

  function updateTime(nextTime: string) {
    onChange(combineDateTime(date || toDateInputValue(new Date()), nextTime));
  }

  function clearValue() {
    onChange('');
  }

  const validationError =
    error ??
    (value && date && !isValidDateInput(date) ? 'Invalid date.' : undefined) ??
    (value && time && !isValidTimeInput(time) ? 'Invalid time.' : undefined);

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-expanded={expanded}
        aria-required={required}
        onClick={() => !disabled && setExpanded((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm',
          'transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled && 'cursor-not-allowed opacity-60',
          validationError && 'border-destructive',
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn(!value && 'text-muted-foreground')}>{displayValue}</span>
        </span>
        {clearable && value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date and time"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              clearValue();
            }}
          >
            ×
          </span>
        ) : null}
      </button>

      {expanded ? (
        <div className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</p>
            <DatePicker
              value={date}
              onChange={updateDate}
              min={minParts.date || undefined}
              max={maxParts.date || undefined}
              disabled={disabled}
              required={required}
              clearable={false}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Time</p>
            <TimePicker
              value={time}
              onChange={updateTime}
              minuteStep={minuteStep}
              disabled={disabled}
              required={required}
              clearable={false}
            />
          </div>
        </div>
      ) : null}

      {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
    </div>
  );
}

export function dateTimePickerValueToIso(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}
