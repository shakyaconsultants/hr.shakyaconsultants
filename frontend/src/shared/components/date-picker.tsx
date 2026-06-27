import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { DropdownPanel } from '@/shared/components/dropdown-panel';
import {
  compareDates,
  formatDateDisplay,
  getCalendarDays,
  isValidDateInput,
  toDateInputValue,
} from '@/shared/utils/datetime';

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  disabledDates?: string[];
  className?: string;
  error?: string;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select date…',
  min,
  max,
  disabled,
  required,
  clearable = true,
  disabledDates = [],
  className,
  error,
}: DatePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const initial = value && isValidDateInput(value) ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const disabledSet = useMemo(() => new Set<string>(disabledDates), [disabledDates]);
  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || !isValidDateInput(value)) return;
    const date = new Date(`${value}T00:00:00`);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, [value]);

  function isDisabledDate(date: string): boolean {
    if (disabledSet.has(date)) return true;
    if (min && compareDates(date, min) < 0) return true;
    if (max && compareDates(date, max) > 0) return true;
    return false;
  }

  function selectDate(date: string) {
    if (isDisabledDate(date)) return;
    onChange(date);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const displayValue = value ? formatDateDisplay(value) : placeholder;
  const validationError =
    error ?? (value && !isValidDateInput(value) ? 'Invalid date selected.' : undefined);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm',
          'transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled && 'cursor-not-allowed opacity-60',
          validationError && 'border-destructive',
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn(!value && 'text-muted-foreground')}>{displayValue}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </span>
      </button>

      {open ? (
        <DropdownPanel className="w-[280px] p-3">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">
              {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1 font-medium">{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((cell) => {
              const selected = value === cell.date;
              const isToday = cell.date === toDateInputValue(new Date());
              const isDisabled = isDisabledDate(cell.date);
              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(cell.date)}
                  className={cn(
                    'h-9 rounded-md text-sm',
                    !cell.inMonth && 'text-muted-foreground/60',
                    selected && 'bg-primary text-primary-foreground',
                    !selected && isToday && 'border border-primary/40',
                    !selected && !isDisabled && 'hover:bg-muted',
                    isDisabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between gap-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => selectDate(toDateInputValue(new Date()))}
            >
              Today
            </button>
            <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </DropdownPanel>
      ) : null}

      {validationError ? <p className="mt-1 text-xs text-destructive">{validationError}</p> : null}
    </div>
  );
}
