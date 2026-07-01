export const DESIGNATION_HIERARCHY_LEVELS = [
  { value: 1, label: 'Entry' },
  { value: 2, label: 'Junior' },
  { value: 3, label: 'Associate' },
  { value: 4, label: 'Mid-Level' },
  { value: 5, label: 'Senior' },
  { value: 6, label: 'Lead' },
  { value: 7, label: 'Manager' },
  { value: 8, label: 'Senior Manager' },
  { value: 9, label: 'Director' },
  { value: 10, label: 'VP' },
  { value: 11, label: 'Executive' },
  { value: 12, label: 'C-Level' },
] as const;

export function buildDesignationFullTitle(designationName: string, _jobRoleName?: string): string {
  return designationName.trim();
}

export function getHierarchyLevelLabel(level?: number): string {
  if (level === undefined || level === null) {
    return '—';
  }
  const match = DESIGNATION_HIERARCHY_LEVELS.find((entry) => entry.value === level);
  return match ? `${level} — ${match.label}` : String(level);
}
