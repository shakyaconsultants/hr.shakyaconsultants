import { useMemo } from 'react';
import type { CalendarDayRecord } from '@/features/attendance/api/attendance.api';
import { useAttendanceCalendar } from '@/features/attendance/hooks/use-attendance';
import { Loading } from '@/shared/components/loading';
import { cn } from '@/shared/utils/cn';

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-amber-100 text-amber-800 border-amber-200',
  half_day: 'bg-orange-100 text-orange-800 border-orange-200',
  on_leave: 'bg-blue-100 text-blue-800 border-blue-200',
  holiday: 'bg-purple-100 text-purple-800 border-purple-200',
};

interface AttendanceCalendarProps {
  employeeId?: string;
  month?: Date;
  showEmployee?: boolean;
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

export function AttendanceCalendar({
  employeeId,
  month,
  showEmployee = false,
}: AttendanceCalendarProps) {
  const reference = month ?? new Date();

  const { startDate, endDate, daysInMonth, startDayOfWeek } = useMemo(() => {
    const year = reference.getFullYear();
    const monthIndex = reference.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    return {
      startDate: dateKeyFromParts(year, monthIndex, 1),
      endDate: dateKeyFromParts(year, monthIndex, last.getDate()),
      daysInMonth: last.getDate(),
      startDayOfWeek: first.getDay(),
    };
  }, [reference]);

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

  if (isLoading) {
    return <Loading message="Loading attendance calendar..." />;
  }

  const monthLabel = reference.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{monthLabel}</h3>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[72px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = dateKeyFromParts(reference.getFullYear(), reference.getMonth(), day);
          const dayRecords = recordsByDate.get(dateKey) ?? [];
          const primaryRecord = dayRecords[0];
          const statusClass = primaryRecord
            ? (STATUS_COLORS[primaryRecord.status] ??
              'bg-muted text-muted-foreground border-border')
            : 'border-border';

          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[88px] rounded-md border p-1.5 text-left text-xs',
                primaryRecord ? statusClass : 'bg-card',
              )}
            >
              <span className="font-medium">{day}</span>
              {dayRecords.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {dayRecords.slice(0, showEmployee ? 3 : 1).map((record) => (
                    <div
                      key={record.id ?? `${record.employeeId}-${record.date}`}
                      className="space-y-0.5"
                    >
                      {showEmployee ? (
                        <p className="truncate font-medium">
                          {record.employeeName ?? record.employeeId}
                        </p>
                      ) : null}
                      <p className="capitalize">{record.status.replace(/_/g, ' ')}</p>
                      {record.checkIn ? (
                        <p className="opacity-80">In: {formatTime(record.checkIn)}</p>
                      ) : null}
                      {record.checkOut ? (
                        <p className="opacity-80">Out: {formatTime(record.checkOut)}</p>
                      ) : null}
                    </div>
                  ))}
                  {showEmployee && dayRecords.length > 3 ? (
                    <p className="opacity-70">+{dayRecords.length - 3} more</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, className]) => (
          <span key={status} className={cn('rounded border px-2 py-0.5 capitalize', className)}>
            {status.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
