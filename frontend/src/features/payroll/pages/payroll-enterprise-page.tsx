import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CalendarDays, ExternalLink, FileText, Layers, Settings } from 'lucide-react';
import { PolicySettingsForm } from '@/features/payroll/components/policy-settings-form';
import { SalaryStructureForm } from '@/features/payroll/components/salary-structure-form';
import {
  useAllowances,
  useDeductions,
  useEnterprisePayrollDashboard,
  usePayrollCalendar,
} from '@/features/payroll/hooks/use-payroll';
import { MASTER_ENTITIES } from '@/features/organization/constants/entity-catalog';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Structures', 'Components', 'Policies', 'Calendar', 'Settings'] as const;

export function PayrollEnterprisePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const year = new Date().getFullYear();

  const { data: dashboard, isLoading } = useEnterprisePayrollDashboard();
  const { data: allowances, isLoading: allowancesLoading } = useAllowances({ pageSize: 50 });
  const { data: deductions, isLoading: deductionsLoading } = useDeductions({ pageSize: 50 });
  const { data: calendar, isLoading: calendarLoading } = usePayrollCalendar(year);

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading payroll admin..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Banknote className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Payroll Administration</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure salary structures, components, policies, and payroll calendar.
          </p>
        </div>
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
          <StatCard icon={Layers} label="Active Structures" value={dashboard.activeStructures} />
          <StatCard icon={FileText} label="Pending Runs" value={dashboard.pendingRuns} />
          <StatCard icon={Banknote} label="Finalized Runs" value={dashboard.finalizedRuns} />
          <StatCard icon={CalendarDays} label="Employees on Payroll" value={dashboard.totalEmployeesOnPayroll} />
        </div>
      ) : null}

      {activeTab === 'Structures' ? (
        <section className="rounded-lg border bg-card p-6">
          <SalaryStructureForm />
        </section>
      ) : null}

      {activeTab === 'Components' ? (
        <section className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-2 font-semibold">Allowances & Deductions</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Salary grades are managed in Organization master data. Link structures to grade bands there.
            </p>
            <Button asChild>
              <Link to={ROUTES.organizationEntity(MASTER_ENTITIES.SALARY_GRADE)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Salary Grades
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Allowances</h3>
            <DataTable
              columns={[
                { key: 'code', header: 'Code' },
                { key: 'name', header: 'Name' },
                { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
                { key: 'amount', header: 'Amount', render: (row) => row.amount.toLocaleString() },
                { key: 'isTaxable', header: 'Taxable', render: (row) => (row.isTaxable ? 'Yes' : 'No') },
              ]}
              data={allowances?.items ?? []}
              isLoading={allowancesLoading}
              emptyMessage="No allowances configured"
            />
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Deductions</h3>
            <DataTable
              columns={[
                { key: 'code', header: 'Code' },
                { key: 'name', header: 'Name' },
                { key: 'type', header: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
                { key: 'amount', header: 'Amount', render: (row) => row.amount.toLocaleString() },
                { key: 'isStatutory', header: 'Statutory', render: (row) => (row.isStatutory ? 'Yes' : 'No') },
              ]}
              data={deductions?.items ?? []}
              isLoading={deductionsLoading}
              emptyMessage="No deductions configured"
            />
          </div>
        </section>
      ) : null}

      {activeTab === 'Policies' ? (
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h2 className="font-semibold">Payroll Policy Settings</h2>
          </div>
          <PolicySettingsForm />
        </section>
      ) : null}

      {activeTab === 'Calendar' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Payroll Calendar {year}</h2>
          <DataTable
            columns={[
              {
                key: 'month',
                header: 'Month',
                render: (row) => new Date(row.year, row.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
              },
              {
                key: 'period',
                header: 'Period',
                render: (row) =>
                  `${new Date(row.periodStart).toLocaleDateString()} – ${new Date(row.periodEnd).toLocaleDateString()}`,
              },
              {
                key: 'payDate',
                header: 'Pay Date',
                render: (row) => new Date(row.payDate).toLocaleDateString(),
              },
              { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
            ]}
            data={calendar ?? []}
            isLoading={calendarLoading}
            emptyMessage="No calendar entries for this year"
          />
        </section>
      ) : null}

      {activeTab === 'Settings' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 font-semibold">System Settings</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Advanced payroll settings are available in the system settings panel under the payroll group.
          </p>
          <Button asChild>
            <Link to={ROUTES.ADMIN_SETTINGS}>Open System Settings</Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}
