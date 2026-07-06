import { useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { AnnexureASalaryTable } from '@/features/payroll/components/annexure-a-salary-table';
import {
  CompensationSetupWizard,
  compensationBreakdownFromAssignment,
} from '@/features/payroll/components/compensation-setup-wizard';
import { CtcBreakdownPanel } from '@/features/payroll/components/ctc-breakdown-panel';
import { PayslipList } from '@/features/payroll/components/payslip-list';
import { SalaryRevisionWizard } from '@/features/payroll/components/salary-revision-wizard';
import { SalaryStructureForm } from '@/features/payroll/components/salary-structure-form';
import {
  useEmployeeCompensation,
  useEmployeeSalaryHistory,
  useMyCompensation,
  useSalaryRevisions,
  useUploadPayslip,
} from '@/features/payroll/hooks/use-payroll';
import { formatInr } from '@/features/payroll/utils/ctc-breakdown.util';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { DatePicker } from '@/shared/components/date-picker';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { DataTable } from '@/shared/components/data-table';

interface EmployeePayrollPanelProps {
  employeeId: string;
  employeeName?: string;
}

type PayrollTab = 'overview' | 'assign' | 'payslips' | 'history';

export function EmployeePayrollPanel({ employeeId, employeeName }: EmployeePayrollPanelProps) {
  const authEmployeeId = useAuthStore((s) => s.employee?.id);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isSelf = authEmployeeId === employeeId;
  const canManage = hasPermission('payroll.update') || hasPermission('payroll.create');
  const canViewPayslips = hasPermission('payslip.read') || hasPermission('payroll.read');
  const canManageStructures = hasPermission('payroll.create') || hasPermission('payroll.update');

  const employeeQuery = useEmployeeCompensation(employeeId);
  const selfQuery = useMyCompensation();
  const compensationQuery = isSelf && !hasPermission('payroll.read') ? selfQuery : employeeQuery;
  const { data: compensation, isLoading } = compensationQuery;

  const { data: history, isLoading: historyLoading } = useEmployeeSalaryHistory(employeeId);
  const { data: revisions } = useSalaryRevisions({ employeeId, pageSize: 20 });
  const uploadPayslip = useUploadPayslip(employeeId);

  const [tab, setTab] = useState<PayrollTab>('overview');
  const [structuresOpen, setStructuresOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [grossSalary, setGrossSalary] = useState('');
  const [netSalary, setNetSalary] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const breakdown = useMemo(() => {
    if (!compensation?.baseSalary) return null;
    return compensationBreakdownFromAssignment(
      compensation.baseSalary,
      compensation.salaryStructure?.components,
      compensation.componentOverrides,
      compensation.currency,
    );
  }, [compensation]);

  const tabs = useMemo((): { id: PayrollTab; label: string; show: boolean }[] => {
    const items: { id: PayrollTab; label: string; show: boolean }[] = [
      { id: 'overview', label: 'Salary Structure', show: true },
      { id: 'assign', label: 'Assign / Update', show: canManage },
      { id: 'payslips', label: 'Payslips', show: canViewPayslips },
      { id: 'history', label: 'History', show: true },
    ];
    return items.filter((item) => item.show);
  }, [canManage, canViewPayslips]);

  if (isLoading) {
    return <Loading message="Loading payroll data..." />;
  }

  const handlePayslipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !periodStart || !periodEnd) {
      setUploadError('Select pay period dates and a PDF file.');
      return;
    }
    await runFormMutation({
      setError: setUploadError,
      successMessage: 'Payslip uploaded successfully.',
      mutation: () =>
        uploadPayslip.mutateAsync({
          file,
          periodStart,
          periodEnd,
          grossSalary: grossSalary ? Number(grossSalary) : undefined,
          netSalary: netSalary ? Number(netSalary) : undefined,
        }),
    });
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Payroll & Compensation</h2>
        <p className="text-sm text-muted-foreground">
          {employeeName
            ? `Professional salary structure and payslips for ${employeeName}.`
            : 'Professional salary structure and payslips.'}
        </p>
      </div>

      {canManageStructures ? (
        <section className="rounded-xl border bg-card">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            onClick={() => setStructuresOpen((open) => !open)}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Company Salary Structures</p>
                <p className="text-sm text-muted-foreground">
                  Define the master Annexure A template used when assigning employee compensation.
                </p>
              </div>
            </div>
            {structuresOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {structuresOpen ? (
            <div className="border-t px-5 py-6">
              <SalaryStructureForm />
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          {compensation && breakdown ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Company structure"
                  value={compensation.salaryStructure?.name ?? '—'}
                />
                <SummaryCard
                  label="Basic (monthly)"
                  value={formatInr(compensation.baseSalary, compensation.currency)}
                />
                <SummaryCard
                  label="Annual CTC"
                  value={formatInr(breakdown.annualCtc, compensation.currency)}
                />
                <SummaryCard
                  label="Net take-home"
                  value={formatInr(breakdown.netTakeHome, compensation.currency)}
                  accent
                />
              </section>

              <section className="rounded-lg border bg-muted/20 p-4 text-sm">
                <p>
                  <span className="font-medium">Source:</span> Company salary structure{' '}
                  <span className="font-mono text-primary">
                    {compensation.salaryStructure?.code ?? '—'}
                  </span>
                  {compensation.salaryStructure?.name
                    ? ` (${compensation.salaryStructure.name})`
                    : ''}{' '}
                  — effective from {new Date(compensation.effectiveFrom).toLocaleDateString()}.
                </p>
              </section>

              <AnnexureASalaryTable breakdown={breakdown} />

              <section>
                <h3 className="mb-3 font-medium">Full payroll breakdown</h3>
                <CtcBreakdownPanel breakdown={breakdown} />
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">No salary assigned</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {canManage
                  ? "Create a company salary structure above, then use Assign / Update to set this employee's compensation."
                  : 'Contact HR to assign your salary structure.'}
              </p>
              {canManage ? (
                <Button type="button" className="mt-4" size="sm" onClick={() => setTab('assign')}>
                  Go to Assign / Update
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'assign' && canManage ? (
        <div className="space-y-6">
          <CompensationSetupWizard employeeId={employeeId} onSuccess={() => setTab('overview')} />

          <section className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium">Salary revision</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevisionOpen((v) => !v)}
              >
                {revisionOpen ? 'Hide wizard' : 'Start revision'}
              </Button>
            </div>
            {revisionOpen ? (
              <SalaryRevisionWizard
                employeeId={employeeId}
                onSuccess={() => setRevisionOpen(false)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Schedule an increment or structure change with effective date and reason.
              </p>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'payslips' && canViewPayslips ? (
        <section className="space-y-4 rounded-xl border bg-card p-6">
          {canManage ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4">
              <p className="mb-3 text-sm font-medium">Upload payslip (PDF)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Period start</span>
                  <DatePicker value={periodStart} onChange={setPeriodStart} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Period end</span>
                  <DatePicker value={periodEnd} onChange={setPeriodEnd} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Gross (optional)</span>
                  <input
                    type="number"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Net (optional)</span>
                  <input
                    type="number"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={netSalary}
                    onChange={(e) => setNetSalary(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  {uploadPayslip.isPending ? 'Uploading...' : 'Choose PDF file'}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={uploadPayslip.isPending}
                    onChange={(e) => void handlePayslipUpload(e)}
                  />
                </label>
              </div>
              {uploadError ? <p className="mt-2 text-sm text-destructive">{uploadError}</p> : null}
            </div>
          ) : null}
          <PayslipList employeeId={employeeId} />
        </section>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-medium">Compensation history</h3>
            <DataTable
              columns={[
                {
                  key: 'structure',
                  header: 'Structure',
                  render: (row) => row.salaryStructure?.name ?? row.salaryStructureId,
                },
                {
                  key: 'baseSalary',
                  header: 'Basic salary',
                  render: (row) => `${row.currency} ${row.baseSalary.toLocaleString('en-IN')}`,
                },
                {
                  key: 'effectiveFrom',
                  header: 'From',
                  render: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <span className="capitalize">{row.status}</span>,
                },
              ]}
              data={history ?? []}
              isLoading={historyLoading}
              emptyMessage="No compensation history"
            />
          </section>

          {(revisions?.items?.length ?? 0) > 0 ? (
            <section className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 font-medium">Salary revisions</h3>
              <DataTable
                columns={[
                  {
                    key: 'previousSalary',
                    header: 'Previous',
                    render: (row) => row.previousSalary.toLocaleString('en-IN'),
                  },
                  {
                    key: 'newSalary',
                    header: 'New',
                    render: (row) => row.newSalary.toLocaleString('en-IN'),
                  },
                  {
                    key: 'effectiveFrom',
                    header: 'Effective',
                    render: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
                  },
                  { key: 'reason', header: 'Reason' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => <span className="capitalize">{row.status}</span>,
                  },
                ]}
                data={revisions?.items ?? []}
                emptyMessage="No revisions"
              />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${accent ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
