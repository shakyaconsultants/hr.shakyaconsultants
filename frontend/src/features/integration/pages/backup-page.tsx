import { Database, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/features/integration/components/status-badge';
import { useBackups, useCreateBackup, useVerifyBackup } from '@/features/integration/hooks/use-integration';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';

export function BackupPage() {
  const { data, isLoading, isError } = useBackups({ page: 1, pageSize: 20 });
  const createMutation = useCreateBackup();
  const verifyMutation = useVerifyBackup();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Database className="h-6 w-6 text-primary" />}
        title="Backups"
        description="Manual tenant backups, history, and verification status."
        actions={
          <Button disabled={createMutation.isPending} onClick={() => void createMutation.mutateAsync()}>
            {createMutation.isPending ? 'Creating…' : 'Create Manual Backup'}
          </Button>
        }
      />

      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Restore architecture (planned)</p>
        <p className="mt-1">
          Point-in-time restore will require a dedicated maintenance window, pre-restore verification,
          and a two-phase commit: (1) validate backup checksum and schema compatibility, (2) restore to an
          isolated staging instance before promoting to production. Full restore UI is deferred until the
          backend restore pipeline is implemented.
        </p>
      </div>

      {isLoading ? <Loading message="Loading backup history..." /> : null}
      {isError ? <p className="text-sm text-muted-foreground">Backups API unavailable.</p> : null}

      <DataTable
        columns={[
          {
            key: 'type',
            header: 'Type',
            render: (row) => <span className="capitalize">{row.type}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'sizeBytes',
            header: 'Size',
            render: (row) =>
              row.sizeBytes ? `${Math.round(row.sizeBytes / (1024 * 1024))} MB` : '—',
          },
          {
            key: 'verified',
            header: 'Verified',
            render: (row) =>
              row.verified ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                  Yes
                </span>
              ) : (
                'No'
              ),
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (row) => new Date(row.createdAt).toLocaleString(),
          },
          {
            key: 'completedAt',
            header: 'Completed',
            render: (row) =>
              row.completedAt ? new Date(row.completedAt).toLocaleString() : '—',
          },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              row.status === 'completed' && !row.verified ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={verifyMutation.isPending}
                  onClick={() => void verifyMutation.mutateAsync(row.id)}
                >
                  Verify
                </Button>
              ) : null,
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No backups recorded yet."
      />
    </div>
  );
}
