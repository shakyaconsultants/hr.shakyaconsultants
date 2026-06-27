import { useId } from 'react';
import { cn } from '@/shared/utils/cn';

export type DurationUnit = 'minutes' | 'hours' | 'days';

export interface DurationInputProps {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit?: DurationUnit;
  onUnitChange?: (unit: DurationUnit) => void;
  suffix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

const UNIT_LABELS: Record<DurationUnit, string> = {
  minutes: 'min',
  hours: 'hr',
  days: 'days',
};

export function DurationInput({
  id,
  value,
  onChange,
  unit = 'minutes',
  onUnitChange,
  suffix,
  min = 0,
  max,
  disabled,
  required,
  placeholder = '0',
  className,
  error,
}: DurationInputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  function handleValueChange(raw: string) {
    if (raw === '') {
      onChange(undefined);
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onChange(parsed);
  }

  const invalid = value !== undefined && (value < min || (max !== undefined && value > max));

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-2">
        <input
          id={fieldId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(event) => handleValueChange(event.target.value)}
          className={cn(
            'h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
            (invalid || error) && 'border-destructive',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
        {onUnitChange ? (
          <select
            aria-label="Duration unit"
            disabled={disabled}
            value={unit}
            onChange={(event) => onUnitChange(event.target.value as DurationUnit)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {(Object.keys(UNIT_LABELS) as DurationUnit[]).map((option) => (
              <option key={option} value={option}>
                {UNIT_LABELS[option]}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
            {suffix ?? UNIT_LABELS[unit]}
          </span>
        )}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && invalid ? <p className="text-xs text-destructive">Value must be between {min} and {max ?? '∞'}.</p> : null}
    </div>
  );
}
