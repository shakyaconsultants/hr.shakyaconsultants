import type { HolidayRecord } from '@/features/organization/holidays/holiday.api';

function padDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function expandWeeklyHoliday(holiday: HolidayRecord, year: number): HolidayRecord[] {
  if (holiday.type !== 'weekly' || holiday.dayOfWeek === undefined || holiday.dayOfWeek === null) {
    return [];
  }

  const items: HolidayRecord[] = [];
  const cursor = new Date(year, 0, 1);
  while (cursor.getFullYear() === year) {
    if (cursor.getDay() === holiday.dayOfWeek) {
      items.push({
        ...holiday,
        date: padDate(year, cursor.getMonth() + 1, cursor.getDate()),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return items;
}

function expandYearlyRecurring(holiday: HolidayRecord, year: number): HolidayRecord | null {
  if (!holiday.date || !holiday.isRecurring || holiday.recurrenceRule !== 'yearly') {
    return null;
  }
  const source = new Date(holiday.date);
  return {
    ...holiday,
    date: padDate(year, source.getMonth() + 1, source.getDate()),
  };
}

/** Expands weekly and yearly recurring holidays into concrete dates for calendar display. */
export function expandHolidaysForYear(holidays: HolidayRecord[], year: number): HolidayRecord[] {
  const expanded: HolidayRecord[] = [];

  for (const holiday of holidays) {
    if (holiday.type === 'weekly') {
      expanded.push(...expandWeeklyHoliday(holiday, year));
      continue;
    }

    const yearly = expandYearlyRecurring(holiday, year);
    if (yearly) {
      expanded.push(yearly);
      continue;
    }

    if (holiday.date) {
      expanded.push(holiday);
    }
  }

  return expanded.sort(
    (a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime(),
  );
}
