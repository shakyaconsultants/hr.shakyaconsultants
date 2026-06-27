import { DatePicker } from '@/shared/components/date-picker';
import { FilterField } from '@/shared/components/filter-bar';

export interface DateRangeFieldsProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromLabel?: string;
  toLabel?: string;
  min?: string;
  max?: string;
}

export function DateRangeFields({
  from,
  to,
  onFromChange,
  onToChange,
  fromLabel = 'From',
  toLabel = 'To',
  min,
  max,
}: DateRangeFieldsProps) {
  return (
    <>
      <FilterField label={fromLabel}>
        <DatePicker value={from} onChange={onFromChange} max={to || max} min={min} />
      </FilterField>
      <FilterField label={toLabel}>
        <DatePicker value={to} onChange={onToChange} min={from || min} max={max} />
      </FilterField>
    </>
  );
}
