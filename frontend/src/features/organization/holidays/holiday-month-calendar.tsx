import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HolidayRecord } from '@/features/organization/holidays/holiday.api';
import { HOLIDAY_TYPE_COLORS, holidayTypeLabel, toDateKey } from '@/features/organization/holidays/holiday.constants';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface HolidayMonthCalendarProps {
  month: Date;
  holidays: HolidayRecord[];
  onMonthChange: (month: Date) => void;
  onSelectHoliday?: (holiday: HolidayRecord) => void;
  onSelectDate?: (dateKey: string) => void;
}

export function HolidayMonthCalendar({
  month,
  holidays,
  onMonthChange,
  onSelectHoliday,
  onSelectDate,
}: HolidayMonthCalendarProps) {
  const { daysInMonth, startDayOfWeek, monthLabel } = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    return {
      daysInMonth: last.getDate(),
      startDayOfWeek: first.getDay(),
      monthLabel: month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    };
  }, [month]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayRecord[]>();
    for (const holiday of holidays) {
      const key = toDateKey(holiday.date);
      const existing = map.get(key) ?? [];
      existing.push(holiday);
      map.set(key, existing);
    }
    return map;
  }, [holidays]);

  function shiftMonth(offset: number) {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>
            Today
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[88px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateKey = toDateKey(new Date(month.getFullYear(), month.getMonth(), day));
          const dayHolidays = holidaysByDate.get(dateKey) ?? [];
          const isToday = dateKey === toDateKey(new Date());

          return (
            <button
              key={dateKey}
              type="button"
              className={cn(
                'min-h-[88px] rounded-md border p-1.5 text-left text-xs transition-colors',
                dayHolidays.length > 0 ? 'border-primary/30 bg-primary/5 hover:bg-primary/10' : 'bg-background hover:bg-muted/40',
                isToday && 'ring-2 ring-primary/40',
              )}
              onClick={() => {
                if (dayHolidays.length === 1) {
                  onSelectHoliday?.(dayHolidays[0]!);
                } else if (dayHolidays.length === 0) {
                  onSelectDate?.(dateKey);
                }
              }}
            >
              <span className="font-semibold">{day}</span>
              <div className="mt-1 space-y-1">
                {dayHolidays.map((holiday) => (
                  <button
                    key={holiday.id}
                    type="button"
                    className={cn(
                      'block w-full truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium',
                      HOLIDAY_TYPE_COLORS[holiday.type ?? 'public'] ?? HOLIDAY_TYPE_COLORS.public,
                    )}
                    title={holiday.name}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectHoliday?.(holiday);
                    }}
                  >
                    {holiday.name}
                  </button>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(HOLIDAY_TYPE_COLORS)
          .filter(([type]) => type !== 'recurring')
          .map(([type, className]) => (
            <span key={type} className={cn('rounded border px-2 py-0.5', className)}>
              {holidayTypeLabel(type)}
            </span>
          ))}
      </div>
    </div>
  );
}
