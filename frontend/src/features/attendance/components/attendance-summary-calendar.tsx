import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttendanceCalendarSummary } from '@/features/attendance/hooks/use-attendance';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

function dateKeyFromParts(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${month}-${dayPart}`;
}

function dateKeyFromValue(dateValue: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 10);
  }
  const parsed = new Date(dateValue);
  return dateKeyFromParts(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function AttendanceSummaryCalendar() {
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const { startDate, endDate, daysInMonth, startDayOfWeek } = useMemo(() => {
    const year = viewMonth.getFullYear();
    const monthIndex = viewMonth.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    return {
      startDate: dateKeyFromParts(year, monthIndex, 1),
      endDate: dateKeyFromParts(year, monthIndex, last.getDate()),
      daysInMonth: last.getDate(),
      startDayOfWeek: first.getDay(),
    };
  }, [viewMonth]);

  const { data, isLoading } = useAttendanceCalendarSummary(startDate, endDate);

  const summaryByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>[number]>();
    (data ?? []).forEach((entry) => {
      map.set(dateKeyFromValue(entry.date), entry);
    });
    return map;
  }, [data]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isCurrentMonth =
    viewMonth.getMonth() === new Date().getMonth() &&
    viewMonth.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{monthLabel}</h3>
          <p className="text-xs text-muted-foreground">Daily present and absent headcount</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewMonth(new Date())}
            disabled={isCurrentMonth}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loading message="Loading attendance summary..." />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {weekdayLabels.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[88px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = dateKeyFromParts(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const summary = summaryByDate.get(dateKey);
              const dayType = summary?.dayType ?? 'working';

              const cellClass =
                dayType === 'weekly_off'
                  ? 'bg-violet-100 text-violet-800 border-violet-200'
                  : dayType === 'holiday'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-card border-border';

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'min-h-[88px] rounded-md border p-1.5 text-left text-xs',
                    cellClass,
                  )}
                >
                  <span className="font-medium">{day}</span>
                  {summary ? (
                    <div className="mt-1 space-y-0.5">
                      {dayType === 'weekly_off' ? (
                        <p className="font-medium">Weekly Off</p>
                      ) : dayType === 'holiday' ? (
                        <p className="font-medium">Holiday</p>
                      ) : (
                        <>
                          <p className="font-medium text-emerald-700">
                            Present: {summary.presentCount}
                          </p>
                          <p className="font-medium text-red-700">Absent: {summary.absentCount}</p>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800">
              Present count
            </span>
            <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-red-800">
              Absent count
            </span>
            <span className="rounded border border-violet-200 bg-violet-100 px-2 py-0.5 text-violet-800">
              Weekly Off
            </span>
            <span className="rounded border border-purple-200 bg-purple-100 px-2 py-0.5 text-purple-800">
              Holiday
            </span>
          </div>
        </>
      )}
    </div>
  );
}
