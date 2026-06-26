export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSlug(value: string, suffix?: string): string {
  const base = slugify(value);
  return suffix ? `${base}-${suffix}` : base;
}
