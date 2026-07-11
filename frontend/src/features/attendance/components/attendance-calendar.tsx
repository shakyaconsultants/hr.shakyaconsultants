import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarDayRecord } from '@/features/attendance/api/attendance.api';
import { useAttendanceCalendar } from '@/features/attendance/hooks/use-attendance';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-amber-100 text-amber-800 border-amber-200',
  half_day: 'bg-orange-100 text-orange-800 border-orange-200',
  on_leave: 'bg-blue-100 text-blue-800 border-blue-200',
  holiday: 'bg-purple-100 text-purple-800 border-purple-200',
  weekend: 'bg-violet-100 text-violet-800 border-violet-200',
  unmarked: 'bg-slate-50 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  half_day: 'Half Day',
  on_leave: 'On Leave',
  holiday: 'Holiday',
  weekend: 'Weekly Off',
  unmarked: 'No Record',
};

interface AttendanceCalendarProps {
  employeeId?: string;
  month?: Date;
  showEmployee?: boolean;
  navigable?: boolean;
}

function dateKeyFromParts(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${month}-${dayPart}`;
}

function dateKeyFromRecord(dateValue: string): string {
  const parsed = new Date(dateValue);
  return dateKeyFromParts(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

function employeeLabel(record: CalendarDayRecord): string {
  return record.employeeName?.trim() || record.employeeNumber || 'Employee';
}

export function AttendanceCalendar({
  employeeId,
  month,
  showEmployee = false,
  navigable = true,
}: AttendanceCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => month ?? new Date());

  useEffect(() => {
    if (month) {
      setViewMonth(month);
    }
  }, [month]);

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

  const { data, isLoading } = useAttendanceCalendar(startDate, endDate, employeeId);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, CalendarDayRecord[]>();
    (data ?? []).forEach((record) => {
      const key = dateKeyFromRecord(record.date);
      const existing = map.get(key) ?? [];
      existing.push(record);
      map.set(key, existing);
    });
    return map;
  }, [data]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isCurrentMonth =
    viewMonth.getMonth() === new Date().getMonth() &&
    viewMonth.getFullYear() === new Date().getFullYear();

  function goToPreviousMonth() {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  function goToToday() {
    setViewMonth(new Date());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{monthLabel}</h3>
        {navigable ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToToday}
              disabled={isCurrentMonth}
            >
              Today
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <Loading message="Loading attendance calendar..." />
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
              const dayRecords = recordsByDate.get(dateKey) ?? [];
              const primaryRecord = employeeId ? dayRecords[0] : dayRecords[0];
              const statusClass = primaryRecord
                ? (STATUS_COLORS[primaryRecord.status] ??
                  'bg-muted text-muted-foreground border-border')
                : 'border-border bg-card';

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'min-h-[96px] rounded-md border p-1.5 text-left text-xs',
                    dayRecords.length > 0 ? statusClass : 'border-border bg-card',
                  )}
                >
                  <span className="font-medium">{day}</span>
                  {dayRecords.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {dayRecords.slice(0, showEmployee ? 4 : 1).map((record) => (
                        <div
                          key={`${record.employeeId ?? 'self'}-${record.date}-${record.status}`}
                          className="space-y-0.5"
                        >
                          {showEmployee ? (
                            <p className="truncate font-medium">{employeeLabel(record)}</p>
                          ) : null}
                          <p>{formatStatusLabel(record.status)}</p>
                          {record.checkIn ? (
                            <p className="opacity-80">In: {formatTime(record.checkIn)}</p>
                          ) : null}
                          {record.checkOut ? (
                            <p className="opacity-80">Out: {formatTime(record.checkOut)}</p>
                          ) : null}
                          {record.status === 'late' &&
                          record.lateMinutes != null &&
                          record.lateMinutes > 0 ? (
                            <p className="opacity-80">Late: {record.lateMinutes}m</p>
                          ) : null}
                        </div>
                      ))}
                      {showEmployee && dayRecords.length > 4 ? (
                        <p className="opacity-70">+{dayRecords.length - 4} more</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(STATUS_COLORS).map(([status, className]) => (
              <span key={status} className={cn('rounded border px-2 py-0.5', className)}>
                {formatStatusLabel(status)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
