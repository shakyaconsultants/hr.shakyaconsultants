import { useState } from 'react';
import { Clock } from 'lucide-react';
import { AttendanceCalendar } from '@/features/attendance/components/attendance-calendar';
import { CorrectionRequestForm } from '@/features/attendance/components/correction-request-form';
import { PunchPanel } from '@/features/attendance/components/punch-panel';
import { useAttendanceRecords, useTodayAttendance } from '@/features/attendance/hooks/use-attendance';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { DataTable } from '@/shared/components/data-table';
import { cn } from '@/shared/utils/cn';

export function AttendanceWorkspacePage() {
  const employeeId = useAuthStore((s) => s.user?.employeeId ?? s.employee?.id ?? '');
  const { data: today } = useTodayAttendance(employeeId);
  const { data: history, isLoading: historyLoading } = useAttendanceRecords({
    employeeId,
    pageSize: 20,
  });
  const [showCorrection, setShowCorrection] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Clock className="h-5 w-5" />
          <h1 className="text-2xl font-bold">My Attendance</h1>
        </div>
        <p className="text-sm text-muted-foreground">Punch in/out, view your calendar, and request corrections.</p>
      </div>

      <PunchPanel />

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">My Calendar</h2>
        <AttendanceCalendar employeeId={employeeId} />
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Attendance History</h2>
          {today?.id ? (
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setShowCorrection((v) => !v)}
            >
              {showCorrection ? 'Hide correction form' : 'Request correction'}
            </button>
          ) : null}
        </div>

        {showCorrection && today?.id ? (
          <div className="mb-6">
            <CorrectionRequestForm
              attendanceId={today.id}
              currentStatus={today.status}
              onSuccess={() => setShowCorrection(false)}
            />
          </div>
        ) : null}

        {historyLoading ? (
          <Loading message="Loading history..." />
        ) : (
          <DataTable
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (row) => new Date(row.date).toLocaleDateString(),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'checkIn',
                header: 'Check In',
                render: (row) =>
                  row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
              },
              {
                key: 'checkOut',
                header: 'Check Out',
                render: (row) =>
                  row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
              },
              {
                key: 'workedMinutes',
                header: 'Worked',
                render: (row) => (row.workedMinutes != null ? `${Math.floor(row.workedMinutes / 60)}h ${row.workedMinutes % 60}m` : '—'),
              },
            ]}
            data={history?.items ?? []}
            emptyMessage="No attendance history"
          />
        )}
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
