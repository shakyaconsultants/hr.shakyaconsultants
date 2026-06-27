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

export const MIN_DESIGNATION_HIERARCHY_LEVEL = 1;
export const MAX_DESIGNATION_HIERARCHY_LEVEL = 12;

export function isValidHierarchyLevel(level: number): boolean {
  return Number.isInteger(level) && level >= MIN_DESIGNATION_HIERARCHY_LEVEL && level <= MAX_DESIGNATION_HIERARCHY_LEVEL;
}

export function getHierarchyLevelLabel(level: number): string {
  const match = DESIGNATION_HIERARCHY_LEVELS.find((entry) => entry.value === level);
  return match ? `${level} — ${match.label}` : String(level);
}

export function buildDesignationFullTitle(designationName: string, jobRoleName?: string): string {
  const base = designationName.trim();
  const role = jobRoleName?.trim();
  if (!role) {
    return base;
  }
  return `${base} ${role}`;
}
