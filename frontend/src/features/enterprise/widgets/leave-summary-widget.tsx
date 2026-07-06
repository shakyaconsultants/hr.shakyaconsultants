import { useCompanyCalendar } from '@/features/leave-exit/hooks/use-leave-exit';
import { useEmployeeLabelMap } from '@/features/employee/hooks/use-employee-label-map';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';
import type { CalendarEvent } from '@/features/leave-exit/api/leave-exit.api';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isApprovedLeaveOnDate(event: CalendarEvent, date: string): boolean {
  if (event.type !== 'approved_leave') {
    return false;
  }

  const start = event.date.slice(0, 10);
  const end = (event.endDate ?? event.date).slice(0, 10);
  return date >= start && date <= end;
}

export function LeaveSummaryWidget() {
  const today = todayIsoDate();
  const { data: events, isLoading, isError } = useCompanyCalendar(today, today);
  const labelMap = useEmployeeLabelMap();

  if (isLoading) {
    return <WidgetSkeleton title="Employees On Leave" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load leave summary.</p>;
  }

  const onLeaveToday = (events ?? []).filter((event) => isApprovedLeaveOnDate(event, today));

  if (onLeaveToday.length === 0) {
    return <p className="text-sm text-muted-foreground">No employees on leave today.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {onLeaveToday.slice(0, 5).map((event) => (
        <li key={event.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
          <span>
            {event.employeeId ? (labelMap.get(event.employeeId) ?? event.title) : event.title}
          </span>
          <span className="text-muted-foreground">On leave</span>
        </li>
      ))}
    </ul>
  );
}
