import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CalendarDays, FileText, Layers, PlayCircle } from 'lucide-react';
import { PolicySettingsForm } from '@/features/payroll/components/policy-settings-form';
import { PayrollGradeBandsPanel } from '@/features/payroll/components/payroll-grade-bands-panel';
import { PayrollProcessPanel } from '@/features/payroll/components/payroll-process-panel';
import { SalaryStructureForm } from '@/features/payroll/components/salary-structure-form';
import {
  useAllowances,
  useDeductions,
  useEnterprisePayrollDashboard,
  usePayrollCalendar,
} from '@/features/payroll/hooks/use-payroll';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Structures & Bands', 'Components', 'Policies', 'Process', 'Calendar'] as const;

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
            Company-wide payroll: structures, statutory toggles, compensation bands, and run processing. Assign individual
            salaries from each employee profile → Payroll tab.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.EMPLOYEES}>Open employees → set salary per person</Link>
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
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Layers} label="Active Structures" value={dashboard.activeStructures} />
            <StatCard icon={FileText} label="Pending Runs" value={dashboard.pendingRuns} />
            <StatCard icon={Banknote} label="Finalized Runs" value={dashboard.finalizedRuns} />
            <StatCard icon={CalendarDays} label="Employees on Payroll" value={dashboard.totalEmployeesOnPayroll} />
          </div>

          <section className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-6">
            <h2 className="text-lg font-semibold">How payroll fits together</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Structures & bands</strong> — template for Basic, HRA, PF, etc.
              </li>
              <li>
                <strong className="text-foreground">Policies</strong> — statutory toggles (PF, ESI, PT, gratuity), lock
                rules, overtime.
              </li>
              <li>
                <strong className="text-foreground">Employee profile → Payroll</strong> — enter salary, upload payslips,
                revisions per person.
              </li>
              <li>
                <strong className="text-foreground">Process</strong> — create payroll runs, approve, and generate payslips.
              </li>
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === 'Structures & Bands' ? (
        <div className="space-y-8">
          <section className="rounded-lg border bg-card p-6">
            <SalaryStructureForm />
          </section>
          <section className="rounded-lg border bg-card p-6">
            <PayrollGradeBandsPanel />
          </section>
        </div>
      ) : null}

      {activeTab === 'Components' ? (
        <section className="space-y-6">
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
          <PolicySettingsForm />
        </section>
      ) : null}

      {activeTab === 'Process' ? (
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Payroll runs</h2>
          </div>
          <PayrollProcessPanel />
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
    </div>
  );
}
