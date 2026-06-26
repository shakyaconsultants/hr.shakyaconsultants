import { useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle, Lock } from 'lucide-react';
import { PayrollProcessPanel } from '@/features/payroll/components/payroll-process-panel';
import {
  useFinancePayrollDashboard,
  usePayrollExceptions,
} from '@/features/payroll/hooks/use-payroll';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const TABS = ['Overview', 'Process', 'Review', 'Exceptions', 'Bulk'] as const;

export function PayrollFinancePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');

  const { data: dashboard, isLoading } = useFinancePayrollDashboard();
  const { data: exceptions, isLoading: exceptionsLoading } = usePayrollExceptions({ pageSize: 50 });

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading finance payroll..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Banknote className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Payroll Finance</h1>
        </div>
        <p className="text-sm text-muted-foreground">Process payroll runs, review, approve, lock, and resolve exceptions.</p>
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
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Banknote} label="Draft Runs" value={dashboard.draftRuns} />
            <StatCard icon={AlertTriangle} label="Processing" value={dashboard.processingRuns} />
            <StatCard icon={CheckCircle} label="Pending Approval" value={dashboard.pendingApproval} />
            <StatCard icon={Lock} label="Locked Runs" value={dashboard.lockedRuns} />
          </div>
          {dashboard.totalNetThisMonth != null ? (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Net This Month</p>
              <p className="text-2xl font-bold">{dashboard.totalNetThisMonth.toLocaleString()}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'Process' || activeTab === 'Review' || activeTab === 'Bulk' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">
            {activeTab === 'Process' ? 'Process Payroll' : activeTab === 'Review' ? 'Review & Approve' : 'Bulk Operations'}
          </h2>
          {activeTab === 'Bulk' ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Select processed runs below and use bulk approve to approve multiple runs at once.
            </p>
          ) : null}
          <PayrollProcessPanel />
        </section>
      ) : null}

      {activeTab === 'Exceptions' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Payroll Exceptions</h2>
          <DataTable
            columns={[
              { key: 'employeeId', header: 'Employee' },
              { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.type.replace(/_/g, ' ')}</span> },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <ExceptionBadge status={row.status} />,
              },
              { key: 'details', header: 'Details', render: (row) => row.details ?? '—' },
            ]}
            data={exceptions?.items ?? []}
            isLoading={exceptionsLoading}
            emptyMessage="No payroll exceptions"
          />
        </section>
      ) : null}
    </div>
  );
}

function ExceptionBadge({ status }: { status: string }) {
  const tone =
    status === 'resolved'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'pending'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';

  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>{status}</span>;
}
