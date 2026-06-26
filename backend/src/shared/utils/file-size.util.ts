export function bytesToHumanReadable(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export function isWithinSizeLimit(bytes: number, maxBytes: number): boolean {
  return bytes <= maxBytes;
}

export function megabytesToBytes(mb: number): number {
  return mb * 1024 * 1024;
}
