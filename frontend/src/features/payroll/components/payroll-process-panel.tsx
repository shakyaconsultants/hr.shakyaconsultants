import { useState } from 'react';
import {
  useApprovePayrollRun,
  useBulkApprovePayrollRuns,
  useCreatePayrollRun,
  useLockPayrollRun,
  usePayrollLineItems,
  usePayrollRuns,
  useProcessPayrollRun,
} from '@/features/payroll/hooks/use-payroll';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

function defaultPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    periodStart: start.toISOString().split('T')[0] ?? '',
    periodEnd: end.toISOString().split('T')[0] ?? '',
  };
}

export function PayrollProcessPanel() {
  const { data: runs, isLoading } = usePayrollRuns({ pageSize: 20 });
  const createRun = useCreatePayrollRun();
  const processRun = useProcessPayrollRun();
  const approveRun = useApprovePayrollRun();
  const lockRun = useLockPayrollRun();
  const bulkApprove = useBulkApprovePayrollRuns();

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const period = defaultPeriod();

  const { data: lineItems, isLoading: lineItemsLoading } = usePayrollLineItems(selectedRunId ?? '', { pageSize: 50 });

  const pendingRuns = (runs?.items ?? []).filter((r) => r.status === 'draft' || r.status === 'processing');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateRun = async () => {
    const run = await createRun.mutateAsync(period);
    setSelectedRunId(run.id);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await bulkApprove.mutateAsync(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void handleCreateRun()} disabled={createRun.isPending}>
          {createRun.isPending ? 'Creating...' : 'Create Draft Run'}
        </Button>
        {pendingRuns.length > 0 ? (
          <Button variant="outline" onClick={() => void handleBulkApprove()} disabled={bulkApprove.isPending || selectedIds.length === 0}>
            Bulk Approve ({selectedIds.length})
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={[
          {
            key: 'select',
            header: '',
            render: (row) =>
              row.status === 'processed' || row.status === 'approved' ? (
                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} />
              ) : null,
          },
          {
            key: 'period',
            header: 'Period',
            render: (row) =>
              `${new Date(row.periodStart).toLocaleDateString()} – ${new Date(row.periodEnd).toLocaleDateString()}`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'totalEmployees',
            header: 'Employees',
            render: (row) => row.totalEmployees ?? '—',
          },
          {
            key: 'totalNet',
            header: 'Total Net',
            render: (row) => (row.totalNet != null ? row.totalNet.toLocaleString() : '—'),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSelectedRunId(row.id)}>
                  View
                </Button>
                {row.status === 'draft' ? (
                  <Button variant="ghost" size="sm" onClick={() => void processRun.mutateAsync(row.id)} disabled={processRun.isPending}>
                    Process
                  </Button>
                ) : null}
                {row.status === 'processed' ? (
                  <Button variant="ghost" size="sm" onClick={() => void approveRun.mutateAsync(row.id)} disabled={approveRun.isPending}>
                    Approve
                  </Button>
                ) : null}
                {row.status === 'approved' ? (
                  <Button variant="ghost" size="sm" onClick={() => void lockRun.mutateAsync(row.id)} disabled={lockRun.isPending}>
                    Lock
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        data={runs?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No payroll runs yet"
      />

      {selectedRunId ? (
        <section className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">Line Items</h3>
          <DataTable
            columns={[
              { key: 'employeeId', header: 'Employee' },
              { key: 'employeeName', header: 'Name', render: (row) => row.employeeName ?? '—' },
              { key: 'grossSalary', header: 'Gross', render: (row) => row.grossSalary.toLocaleString() },
              { key: 'totalDeductions', header: 'Deductions', render: (row) => row.totalDeductions.toLocaleString() },
              { key: 'netSalary', header: 'Net', render: (row) => row.netSalary.toLocaleString() },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
            ]}
            data={lineItems?.items ?? []}
            isLoading={lineItemsLoading}
            emptyMessage="No line items for this run"
          />
        </section>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'locked' || status === 'finalized'
      ? 'bg-slate-100 text-slate-800'
      : status === 'approved' || status === 'processed'
        ? 'bg-emerald-100 text-emerald-800'
        : status === 'processing'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-muted text-muted-foreground';

  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>{status.replace(/_/g, ' ')}</span>;
}
