import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Clock, Users } from 'lucide-react';
import { AttendanceCalendar } from '@/features/attendance/components/attendance-calendar';
import {
  useAttendanceExceptions,
  useManagerAttendanceDashboard,
  useTeamAttendance,
} from '@/features/attendance/hooks/use-attendance';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

export function AttendanceManagerPage() {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const { data: dashboard, isLoading: dashboardLoading } = useManagerAttendanceDashboard();
  const { data: team, isLoading: teamLoading } = useTeamAttendance({ startDate: today, endDate: today, pageSize: 50 });
  const { data: exceptions, isLoading: exceptionsLoading } = useAttendanceExceptions({ type: 'missing_punch', pageSize: 20 });

  if (dashboardLoading) {
    return <Loading message="Loading team attendance..." />;
  }

  const lateRecords = (team?.items ?? []).filter((r) => r.status === 'late');
  const missingRecords = exceptions?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Team Attendance</h1>
          </div>
          <p className="text-sm text-muted-foreground">Monitor your team's attendance, late arrivals, and missing punches.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={ROUTES.APPROVAL_INBOX}>Pending Approvals</Link>
        </Button>
      </div>

      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Present Today" value={dashboard.presentToday} />
          <StatCard icon={Users} label="Absent Today" value={dashboard.absentToday} />
          <StatCard icon={Clock} label="Late Today" value={dashboard.lateToday} />
          <StatCard icon={AlertTriangle} label="Missing Punches" value={dashboard.missingPunches} />
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Today's Team Attendance</h2>
        <DataTable
          columns={[
            { key: 'employeeId', header: 'Employee' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: 'checkIn',
              header: 'Check In',
              render: (row) => (row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
            },
            {
              key: 'checkOut',
              header: 'Check Out',
              render: (row) => (row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
            },
            {
              key: 'lateMinutes',
              header: 'Late (min)',
              render: (row) => row.lateMinutes ?? '—',
            },
          ]}
          data={team?.items ?? []}
          isLoading={teamLoading}
          emptyMessage="No team attendance records for today"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold">Late Arrivals</h2>
          </div>
          {lateRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No late arrivals today</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lateRecords.map((record) => (
                <li key={record.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{record.employeeId}</span>
                  <span className="text-muted-foreground">{record.lateMinutes ?? 0} min late</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="font-semibold">Missing Punches</h2>
          </div>
          {missingRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missing punches</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {missingRecords.map((item) => (
                <li key={item.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{item.employeeId}</span>
                  <span className="capitalize text-muted-foreground">{item.type.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          )}
          {exceptionsLoading ? <p className="text-sm text-muted-foreground">Loading exceptions...</p> : null}
        </section>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <h2 className="font-semibold">Team Calendar</h2>
        </div>
        <AttendanceCalendar showEmployee />
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'present'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'absent'
        ? 'bg-red-100 text-red-800'
        : status === 'late'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-muted text-muted-foreground';

  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>{status.replace(/_/g, ' ')}</span>;
}
