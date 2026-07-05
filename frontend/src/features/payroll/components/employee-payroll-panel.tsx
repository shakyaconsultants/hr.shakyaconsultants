import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { CompensationAssignmentForm } from '@/features/payroll/components/compensation-assignment-form';
import { CtcBreakdownPanel } from '@/features/payroll/components/ctc-breakdown-panel';
import { PayslipList } from '@/features/payroll/components/payslip-list';
import { SalaryRevisionWizard } from '@/features/payroll/components/salary-revision-wizard';
import {
  useEmployeeCompensation,
  useEmployeeSalaryHistory,
  useSalaryRevisions,
  useUploadPayslip,
} from '@/features/payroll/hooks/use-payroll';
import { computeCtcBreakdown } from '@/features/payroll/utils/ctc-breakdown.util';
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

export function EmployeePayrollPanel({ employeeId, employeeName }: EmployeePayrollPanelProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('payroll.update') || hasPermission('payroll.create');
  const canViewPayslips = hasPermission('payslip.read') || hasPermission('payroll.read');

  const { data: compensation, isLoading } = useEmployeeCompensation(employeeId);
  const { data: history, isLoading: historyLoading } = useEmployeeSalaryHistory(employeeId);
  const { data: revisions } = useSalaryRevisions({ employeeId, pageSize: 20 });
  const uploadPayslip = useUploadPayslip(employeeId);

  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [grossSalary, setGrossSalary] = useState('');
  const [netSalary, setNetSalary] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [revisionOpen, setRevisionOpen] = useState(false);

  const breakdown = useMemo(() => {
    if (!compensation?.baseSalary) return null;
    return computeCtcBreakdown({
      baseSalary: compensation.baseSalary,
      components: compensation.salaryStructure?.components ?? [],
      currency: compensation.currency,
    });
  }, [compensation]);

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
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Payroll & Compensation</h2>
        <p className="text-sm text-muted-foreground">
          {employeeName ? `Manage salary, CTC, and payslips for ${employeeName}.` : 'Manage salary, CTC, and payslips.'}
        </p>
      </div>

      {compensation ? (
        <section className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Current compensation</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Structure</dt>
              <dd className="font-medium">{compensation.salaryStructure?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Basic salary (monthly)</dt>
              <dd className="font-medium">
                {compensation.currency} {compensation.baseSalary.toLocaleString('en-IN')}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Effective from</dt>
              <dd>{new Date(compensation.effectiveFrom).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{compensation.isLocked ? 'Locked' : compensation.status}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No compensation assigned yet. {canManage ? 'Use the form below to set salary and structure.' : 'Contact HR to assign compensation.'}
        </p>
      )}

      {breakdown ? (
        <section>
          <h3 className="mb-3 font-medium">CTC breakdown</h3>
          <CtcBreakdownPanel breakdown={breakdown} />
        </section>
      ) : null}

      {canManage ? (
        <>
          <section className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-medium">Assign / update salary</h3>
            <CompensationAssignmentForm employeeId={employeeId} />
          </section>

          <section className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium">Salary revision</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setRevisionOpen((v) => !v)}>
                {revisionOpen ? 'Hide wizard' : 'Start revision'}
              </Button>
            </div>
            {revisionOpen ? (
              <SalaryRevisionWizard employeeId={employeeId} onSuccess={() => setRevisionOpen(false)} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Schedule an increment or structure change with effective date and reason.
              </p>
            )}
          </section>
        </>
      ) : null}

      {canViewPayslips ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h3 className="font-medium">Payslips</h3>
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

      <section className="rounded-lg border bg-card p-6">
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
              header: 'Base salary',
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
        <section className="rounded-lg border bg-card p-6">
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
  );
}
