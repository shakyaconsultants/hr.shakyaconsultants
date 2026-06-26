import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, Clock, Users } from 'lucide-react';
import {
  useAttendanceExceptions,
  useCorrections,
  useHrAttendanceDashboard,
} from '@/features/attendance/hooks/use-attendance';
import { useApprovalInbox, useBulkApprove } from '@/features/approval/hooks/use-approval';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

const TABS = ['Overview', 'Corrections', 'Pending', 'Exceptions'] as const;

interface PendingApprovalRow {
  id: string;
  title: string;
  requesterEmployeeId: string;
  status: string;
  submittedAt?: string;
}

export function AttendanceHrPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: dashboard, isLoading: dashboardLoading } = useHrAttendanceDashboard();
  const { data: corrections, isLoading: correctionsLoading } = useCorrections({ pageSize: 50 });
  const { data: exceptions, isLoading: exceptionsLoading } = useAttendanceExceptions({ pageSize: 50 });
  const { data: inbox, isLoading: inboxLoading } = useApprovalInbox({
    requestType: 'attendance_correction',
    pageSize: 50,
  });
  const bulkApprove = useBulkApprove();

  const pendingCorrections = (corrections?.items ?? []).filter((c) => c.status === 'pending');
  const attendanceInbox = (inbox?.items ?? []).filter((r) => r.requestType === 'attendance_correction');

  const pendingRows: PendingApprovalRow[] =
    attendanceInbox.length > 0
      ? attendanceInbox.map((r) => ({
          id: r.id,
          title: r.title,
          requesterEmployeeId: r.requesterEmployeeId,
          status: r.status,
          submittedAt: r.submittedAt,
        }))
      : pendingCorrections.map((c) => ({
          id: c.approvalRequestId ?? c.id,
          title: `Correction: ${c.originalStatus} → ${c.adjustedStatus}`,
          requesterEmployeeId: c.employeeId,
          status: c.status,
          submittedAt: c.createdAt,
        }));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await bulkApprove.mutateAsync({ requestIds: selectedIds });
    setSelectedIds([]);
  };

  if (dashboardLoading && activeTab === 'Overview') {
    return <Loading message="Loading HR attendance overview..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <h1 className="text-2xl font-bold">HR Attendance</h1>
          </div>
          <p className="text-sm text-muted-foreground">Review corrections, exceptions, and pending approvals.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={ROUTES.APPROVAL_INBOX}>Approval Inbox</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'Overview' && dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Present Today" value={dashboard.presentToday} />
          <StatCard icon={Users} label="Absent Today" value={dashboard.absentToday} />
          <StatCard icon={Clock} label="Late Today" value={dashboard.lateToday} />
          <StatCard icon={ClipboardCheck} label="Pending Corrections" value={dashboard.pendingCorrections} />
          <StatCard icon={AlertTriangle} label="Missing Punches" value={dashboard.missingPunches} />
          <StatCard icon={Users} label="On Leave Today" value={dashboard.onLeaveToday} />
        </div>
      ) : null}

      {activeTab === 'Corrections' ? (
        <DataTable
          columns={[
            { key: 'employeeId', header: 'Employee' },
            {
              key: 'originalStatus',
              header: 'Original',
              render: (row) => <StatusBadge status={row.originalStatus} />,
            },
            {
              key: 'adjustedStatus',
              header: 'Requested',
              render: (row) => <StatusBadge status={row.adjustedStatus} />,
            },
            { key: 'reason', header: 'Reason' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
          data={corrections?.items ?? []}
          isLoading={correctionsLoading}
          emptyMessage="No correction requests"
        />
      ) : null}

      {activeTab === 'Pending' ? (
        <section className="space-y-4">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
              <Button size="sm" onClick={() => void handleBulkApprove()} disabled={bulkApprove.isPending}>
                {bulkApprove.isPending ? 'Approving...' : 'Bulk Approve'}
              </Button>
            </div>
          ) : null}

          <DataTable
            columns={[
              {
                key: 'select',
                header: '',
                render: (row) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ),
              },
              { key: 'title', header: 'Request' },
              { key: 'requesterEmployeeId', header: 'Employee' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'submittedAt',
                header: 'Submitted',
                render: (row) => (row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '—'),
              },
            ]}
            data={pendingRows}
            isLoading={inboxLoading || correctionsLoading}
            emptyMessage="No pending correction approvals"
          />
        </section>
      ) : null}

      {activeTab === 'Exceptions' ? (
        <DataTable
          columns={[
            { key: 'employeeId', header: 'Employee' },
            {
              key: 'date',
              header: 'Date',
              render: (row) => new Date(row.date).toLocaleDateString(),
            },
            {
              key: 'type',
              header: 'Type',
              render: (row) => <span className="capitalize">{row.type.replace(/_/g, ' ')}</span>,
            },
            { key: 'details', header: 'Details', render: (row) => row.details ?? '—' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
          data={exceptions?.items ?? []}
          isLoading={exceptionsLoading}
          emptyMessage="No attendance exceptions"
        />
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'approved' || status === 'present'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'rejected' || status === 'absent'
        ? 'bg-red-100 text-red-800'
        : status === 'pending' || status === 'late'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-muted text-muted-foreground';

  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>{status.replace(/_/g, ' ')}</span>;
}
