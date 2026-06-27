import { AsyncSearchSelect } from '@/shared/components/async-search-select';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export interface StatusFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StatusFilterSelect({ value, onChange, className }: StatusFilterSelectProps) {
  return (
    <AsyncSearchSelect
      value={value}
      onChange={onChange}
      options={STATUS_FILTER_OPTIONS}
      placeholder="All statuses"
      searchPlaceholder="Filter status…"
      clearable={false}
      className={className}
    />
  );
}
