export type TimeFormatPreference = '12h' | '24h';

const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_24H.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime24(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatTimeDisplay(value: string, preference: TimeFormatPreference = '24h'): string {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return value;
  if (preference === '24h') return minutesToTime24(minutes);

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

export function formatDateDisplay(value: string): string {
  if (!DATE_ISO.test(value)) return value;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTimeDisplay(value: string, preference: TimeFormatPreference = '24h'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const timePart = formatTimeDisplay(
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    preference,
  );
  return `${datePart} · ${timePart}`;
}

export function toDateInputValue(value: string | Date | undefined | null): string {
  if (!value) return '';
  if (typeof value === 'string' && DATE_ISO.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateTimeLocalValue(value: string | Date | undefined | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function dateTimeLocalToIso(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function isValidDateInput(value: string): boolean {
  if (!DATE_ISO.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export function isValidTimeInput(value: string): boolean {
  return TIME_24H.test(value.trim());
}

export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

export function calculateWorkingMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number,
  isNightShift: boolean,
): number | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return null;

  let duration = end - start;
  if (isNightShift || duration <= 0) {
    duration += 24 * 60;
  }

  return Math.max(0, duration - Math.max(0, breakMinutes));
}

export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function getCalendarDays(year: number, month: number): Array<{ date: string; day: number; inMonth: boolean }> {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];

  for (let index = 0; index < startOffset; index += 1) {
    const date = new Date(year, month, index - startOffset + 1);
    cells.push({ date: toDateInputValue(date), day: date.getDate(), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: toDateInputValue(new Date(year, month, day)), day, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = new Date(year, month, daysInMonth + (cells.length - startOffset - daysInMonth) + 1);
    cells.push({ date: toDateInputValue(last), day: last.getDate(), inMonth: false });
  }

  return cells;
}
