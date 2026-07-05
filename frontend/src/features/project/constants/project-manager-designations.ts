export const PROJECT_MANAGER_DESIGNATION_NAMES = ['project manager', 'product manager'] as const;

export function isProjectManagerDesignation(name?: string | null): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return (PROJECT_MANAGER_DESIGNATION_NAMES as readonly string[]).includes(normalized);
}
