export const HOLIDAY_MODULE_TYPES = [
  { value: 'national', label: 'National Holidays' },
  { value: 'festival', label: 'Festival Pack' },
  { value: 'weekly', label: 'Weekly Offs' },
  { value: 'regional', label: 'Regional / State' },
  { value: 'custom', label: 'Custom Calendar' },
] as const;

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export function holidayModuleTypeLabel(type?: string): string {
  return (
    HOLIDAY_MODULE_TYPES.find((item) => item.value === type)?.label ??
    type?.replace(/_/g, ' ') ??
    'Module'
  );
}

export function weekdayLabel(day?: number): string {
  return WEEKDAY_OPTIONS.find((item) => item.value === day)?.label ?? '—';
}
