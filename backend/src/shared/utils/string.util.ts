export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function truncate(value: string, maxLength: number, suffix = '...'): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - suffix.length) + suffix;
}

export function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => capitalize(word))
    .join(' ');
}

export function sanitizeString(value: string): string {
  // eslint-disable-next-line no-control-regex -- intentional control character strip
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
