import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Clock, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import {
  DropdownPanel,
  dropdownListClassName,
  dropdownOptionClassName,
  dropdownOptionSelectedClassName,
} from '@/shared/components/dropdown-panel';
import { useTimeFormat } from '@/shared/hooks/use-time-format';
import {
  formatTimeDisplay,
  isValidTimeInput,
  minutesToTime24,
  parseTimeToMinutes,
} from '@/shared/utils/datetime';

export interface TimePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minuteStep?: number;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  className?: string;
  error?: string;
}

function buildTimeOptions(minuteStep: number): string[] {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += minuteStep) {
    options.push(minutesToTime24(minutes));
  }
  return options;
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = 'Select time…',
  minuteStep = 15,
  disabled,
  required,
  clearable = true,
  className,
  error,
}: TimePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const timeFormat = useTimeFormat();

  const options = useMemo(() => buildTimeOptions(minuteStep), [minuteStep]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => {
      const display = formatTimeDisplay(option, timeFormat).toLowerCase();
      return option.includes(term) || display.includes(term);
    });
  }, [options, query, timeFormat]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value && isValidTimeInput(value) ? formatTimeDisplay(value, timeFormat) : placeholder;
  const validationError = error ?? (value && !isValidTimeInput(value) ? 'Invalid time selected.' : undefined);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
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
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn(!value && 'text-muted-foreground')}>{displayValue}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear time"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open ? (
        <DropdownPanel className="w-full">
          <div className="border-b border-border bg-popover p-2">
            <input
              type="search"
              autoFocus
              value={query}
              placeholder="Filter times…"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && filtered[0]) {
                  event.preventDefault();
                  onChange(filtered[0]);
                  setOpen(false);
                  setQuery('');
                }
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className={cn(dropdownListClassName, 'max-h-56')} role="listbox">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No matching times</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    dropdownOptionClassName,
                    'px-3 py-2',
                    value === option && dropdownOptionSelectedClassName,
                  )}
                >
                  {formatTimeDisplay(option, timeFormat)}
                  <span className="ml-auto text-xs text-muted-foreground">{option}</span>
                </button>
              ))
            )}
          </div>
        </DropdownPanel>
      ) : null}

      {validationError ? <p className="mt-1 text-xs text-destructive">{validationError}</p> : null}
    </div>
  );
}

export function validateEndAfterStart(
  startTime: string,
  endTime: string,
  allowOvernight: boolean,
): string | undefined {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return undefined;
  if (allowOvernight) return undefined;
  if (end <= start) return 'End time must be after start time.';
  return undefined;
}
