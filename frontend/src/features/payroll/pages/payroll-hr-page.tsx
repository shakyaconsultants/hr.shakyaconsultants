import { useState } from 'react';
import { AlertTriangle, Banknote, Users } from 'lucide-react';
import { CompensationAssignmentForm } from '@/features/payroll/components/compensation-assignment-form';
import { SalaryRevisionWizard } from '@/features/payroll/components/salary-revision-wizard';
import { useCompensations, useHrPayrollDashboard, useSalaryRevisions } from '@/features/payroll/hooks/use-payroll';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const TABS = ['Overview', 'Assignment', 'Revision', 'History'] as const;

export function PayrollHrPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [employeeId, setEmployeeId] = useState('');

  const { data: dashboard, isLoading } = useHrPayrollDashboard();
  const { data: compensations, isLoading: compensationsLoading } = useCompensations({ pageSize: 50 });
  const { data: revisions, isLoading: revisionsLoading } = useSalaryRevisions({ pageSize: 50 });

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading HR payroll..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <h1 className="text-2xl font-bold">HR Payroll</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Assign compensation, process salary revisions, and view history. Locked records cannot be edited.
        </p>
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
          <StatCard icon={Users} label="Assigned Employees" value={dashboard.assignedEmployees} />
          <StatCard icon={Banknote} label="Pending Revisions" value={dashboard.pendingRevisions} />
          <StatCard icon={AlertTriangle} label="Locked Compensations" value={dashboard.lockedCompensations} />
          <StatCard icon={Users} label="Unassigned" value={dashboard.unassignedEmployees} />
        </div>
      ) : null}

      {(activeTab === 'Assignment' || activeTab === 'Revision') && (
        <section className="rounded-lg border bg-card p-6 space-y-4">
          <label className="block max-w-md space-y-1 text-sm">
            <span className="font-medium">Employee ID</span>
            <input
              className="w-full rounded-md border p-2"
              placeholder="Enter employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </label>
        </section>
      )}

      {activeTab === 'Assignment' && employeeId ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Compensation Assignment</h2>
          <CompensationAssignmentForm employeeId={employeeId} />
        </section>
      ) : null}

      {activeTab === 'Assignment' && !employeeId ? (
        <p className="text-sm text-muted-foreground">Enter an employee ID to assign or update compensation.</p>
      ) : null}

      {activeTab === 'Revision' && employeeId ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Salary Revision Wizard</h2>
          <SalaryRevisionWizard employeeId={employeeId} />
        </section>
      ) : null}

      {activeTab === 'Revision' && !employeeId ? (
        <p className="text-sm text-muted-foreground">Enter an employee ID to start a salary revision.</p>
      ) : null}

      {activeTab === 'History' ? (
        <section className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Compensation Assignments</h2>
            <DataTable
              columns={[
                { key: 'employeeId', header: 'Employee' },
                {
                  key: 'structure',
                  header: 'Structure',
                  render: (row) => row.salaryStructure?.name ?? row.salaryStructureId,
                },
                {
                  key: 'baseSalary',
                  header: 'Base Salary',
                  render: (row) => `${row.currency} ${row.baseSalary.toLocaleString()}`,
                },
                {
                  key: 'effectiveFrom',
                  header: 'Effective From',
                  render: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
                },
                {
                  key: 'isLocked',
                  header: 'Locked',
                  render: (row) =>
                    row.isLocked ? (
                      <span className="flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Locked
                      </span>
                    ) : (
                      'No'
                    ),
                },
              ]}
              data={compensations?.items ?? []}
              isLoading={compensationsLoading}
              emptyMessage="No compensation records"
            />
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Salary Revisions</h2>
            <DataTable
              columns={[
                { key: 'employeeId', header: 'Employee' },
                {
                  key: 'previousSalary',
                  header: 'Previous',
                  render: (row) => row.previousSalary.toLocaleString(),
                },
                {
                  key: 'newSalary',
                  header: 'New',
                  render: (row) => row.newSalary.toLocaleString(),
                },
                {
                  key: 'effectiveFrom',
                  header: 'Effective From',
                  render: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
                },
                { key: 'reason', header: 'Reason' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <span className={cn('capitalize', row.status === 'approved' && 'text-emerald-600')}>{row.status}</span>,
                },
              ]}
              data={revisions?.items ?? []}
              isLoading={revisionsLoading}
              emptyMessage="No salary revisions"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
