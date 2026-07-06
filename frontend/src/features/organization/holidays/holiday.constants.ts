export const HOLIDAY_TYPES = [
  { value: 'public', label: 'Public Holiday' },
  { value: 'festival', label: 'Festival Holiday' },
  { value: 'company', label: 'Company Holiday' },
  { value: 'branch', label: 'Branch Holiday' },
  { value: 'weekly', label: 'Weekly Off' },
  { value: 'optional', label: 'Optional Holiday' },
] as const;

export const HOLIDAY_TYPE_COLORS: Record<string, string> = {
  public:
    'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800',
  festival:
    'bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800',
  company:
    'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
  branch:
    'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800',
  weekly:
    'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800',
  optional:
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700',
  recurring:
    'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800',
};

export const RECURRENCE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'yearly', label: 'Yearly (same date)' },
  { value: 'monthly', label: 'Monthly (same day)' },
] as const;

export function holidayTypeLabel(type?: string): string {
  return (
    HOLIDAY_TYPES.find((item) => item.value === type)?.label ??
    type?.replace(/_/g, ' ') ??
    'Holiday'
  );
}

export function toDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHolidayDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
