export function getExtensionFromMime(mimeType: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  return map[mimeType] ?? null;
}

export function isMimeTypeAllowed(mimeType: string, allowed: readonly string[]): boolean {
  return allowed.includes(mimeType);
}

export function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}
