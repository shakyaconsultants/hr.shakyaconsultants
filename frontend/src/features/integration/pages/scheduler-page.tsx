import { useState } from 'react';
import { Clock } from 'lucide-react';
import { StatusBadge } from '@/features/integration/components/status-badge';
import {
  useSchedulerFailures,
  useSchedulerJobHistory,
  useSchedulerJobs,
  useToggleSchedulerJob,
} from '@/features/integration/hooks/use-integration';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';

export function SchedulerPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: jobs, isLoading, isError } = useSchedulerJobs();
  const { data: history, isLoading: historyLoading } = useSchedulerJobHistory(selectedJobId ?? '');
  const { data: failures, isLoading: failuresLoading } = useSchedulerFailures({ page: 1, pageSize: 20 });
  const toggleMutation = useToggleSchedulerJob();

  async function handleToggle(jobId: string, enabled: boolean) {
    setTogglingId(jobId);
    try {
      await toggleMutation.mutateAsync({ id: jobId, enabled });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Clock className="h-6 w-6 text-primary" />}
        title="Scheduler"
        description="Manage cron jobs, enable or disable scheduled tasks, and review run history and failures."
      />

      {isLoading ? <Loading message="Loading scheduler jobs..." /> : null}
      {isError ? <p className="text-sm text-muted-foreground">Scheduler API unavailable.</p> : null}

      <DataTable
        columns={[
          { key: 'name', header: 'Job' },
          { key: 'cron', header: 'Cron', render: (row) => <code>{row.cron}</code> },
          { key: 'handler', header: 'Handler' },
          {
            key: 'enabled',
            header: 'Status',
            render: (row) => <StatusBadge status={row.enabled ? 'active' : 'disabled'} />,
          },
          {
            key: 'lastRunAt',
            header: 'Last Run',
            render: (row) => (row.lastRunAt ? new Date(row.lastRunAt).toLocaleString() : 'Never'),
          },
          {
            key: 'nextRunAt',
            header: 'Next Run',
            render: (row) => (row.nextRunAt ? new Date(row.nextRunAt).toLocaleString() : '—'),
          },
          {
            key: 'lastStatus',
            header: 'Last Result',
            render: (row) => (row.lastStatus ? <StatusBadge status={row.lastStatus} /> : '—'),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelectedJobId(row.id)}>
                  History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={togglingId === row.id}
                  onClick={() => void handleToggle(row.id, !row.enabled)}
                >
                  {row.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ),
          },
        ]}
        data={jobs ?? []}
        isLoading={isLoading}
        emptyMessage="No scheduled jobs configured."
        onRowClick={(row) => setSelectedJobId(row.id)}
      />

      {selectedJobId ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Run History</h2>
          {historyLoading ? <Loading message="Loading run history..." /> : null}
          <DataTable
            columns={[
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'startedAt',
                header: 'Started',
                render: (row) => new Date(row.startedAt).toLocaleString(),
              },
              {
                key: 'durationMs',
                header: 'Duration',
                render: (row) => (row.durationMs != null ? `${row.durationMs}ms` : '—'),
              },
              {
                key: 'errorMessage',
                header: 'Error',
                render: (row) => row.errorMessage ?? '—',
              },
            ]}
            data={history?.items ?? []}
            emptyMessage="No run history for this job."
          />
        </section>
      ) : null}

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Failures
        </h2>
        {failuresLoading ? <Loading message="Loading failures..." /> : null}
        <DataTable
          columns={[
            { key: 'jobId', header: 'Job ID' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: 'startedAt',
              header: 'Started',
              render: (row) => new Date(row.startedAt).toLocaleString(),
            },
            {
              key: 'errorMessage',
              header: 'Error',
              render: (row) => row.errorMessage ?? '—',
            },
          ]}
          data={failures?.items ?? []}
          emptyMessage="No scheduler failures recorded."
        />
      </section>
    </div>
  );
}
