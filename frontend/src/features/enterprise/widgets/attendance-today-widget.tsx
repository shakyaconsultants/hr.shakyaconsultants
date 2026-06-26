import { useEnterpriseAttendanceDashboard } from '@/features/attendance/hooks/use-attendance';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function AttendanceTodayWidget() {
  const { data, isLoading, isError } = useEnterpriseAttendanceDashboard();

  if (isLoading) {
    return <WidgetSkeleton title="Attendance Today" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Unable to load attendance summary.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-muted-foreground">Present</dt>
          <dd className="text-lg font-semibold text-emerald-700">{data.presentToday}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Absent</dt>
          <dd className="text-lg font-semibold text-red-700">{data.absentToday}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Late</dt>
          <dd className="text-lg font-semibold text-amber-700">{data.lateToday}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">On Leave</dt>
          <dd className="text-lg font-semibold">{data.onLeaveToday}</dd>
        </div>
      </dl>
      <Link to={ROUTES.ATTENDANCE} className="text-xs text-primary hover:underline">
        View attendance →
      </Link>
    </div>
  );
}
