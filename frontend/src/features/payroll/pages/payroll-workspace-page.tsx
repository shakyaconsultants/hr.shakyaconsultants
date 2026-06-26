import { Banknote } from 'lucide-react';
import { PayslipList } from '@/features/payroll/components/payslip-list';
import { useMySalary } from '@/features/payroll/hooks/use-payroll';
import { Loading } from '@/shared/components/loading';
import { cn } from '@/shared/utils/cn';

export function PayrollWorkspacePage() {
  const { data: salary, isLoading } = useMySalary();

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Banknote className="h-5 w-5" />
          <h1 className="text-2xl font-bold">My Payroll</h1>
        </div>
        <p className="text-sm text-muted-foreground">View your salary details, payslips, and download history.</p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">My Salary</h2>
        {isLoading ? (
          <Loading message="Loading salary details..." />
        ) : salary ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Base Salary</dt>
              <dd className="text-xl font-bold">
                {salary.currency} {salary.baseSalary.toLocaleString()}
              </dd>
            </div>
            {salary.structureName ? (
              <div>
                <dt className="text-sm text-muted-foreground">Structure</dt>
                <dd>{salary.structureName}</dd>
              </div>
            ) : null}
            {salary.effectiveFrom ? (
              <div>
                <dt className="text-sm text-muted-foreground">Effective From</dt>
                <dd>{new Date(salary.effectiveFrom).toLocaleDateString()}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium',
                    salary.isLocked ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800',
                  )}
                >
                  {salary.isLocked ? 'Locked' : 'Active'}
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Salary information is not available yet.</p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">My Payslips</h2>
        <PayslipList ownOnly />
      </section>
    </div>
  );
}
