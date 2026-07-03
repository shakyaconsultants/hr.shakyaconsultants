import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Banknote } from 'lucide-react';
import { PayslipList } from '@/features/payroll/components/payslip-list';
import { CtcBreakdownPanel } from '@/features/payroll/components/ctc-breakdown-panel';
import { useMySalary } from '@/features/payroll/hooks/use-payroll';
import { computeCtcBreakdown } from '@/features/payroll/utils/ctc-breakdown.util';
import { Loading } from '@/shared/components/loading';
import { cn } from '@/shared/utils/cn';
import { ROUTES } from '@/config/app.config';

export function PayrollWorkspacePage() {
  const { data: salary, isLoading } = useMySalary();

  const breakdown = useMemo(() => {
    if (!salary?.baseSalary) return null;
    return computeCtcBreakdown({
      baseSalary: salary.baseSalary,
      components: salary.components,
      currency: salary.currency,
    });
  }, [salary]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <Banknote className="h-5 w-5" />
          <h1 className="text-2xl font-bold">My Payroll</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View your CTC breakdown, salary components, and payslip history.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Compensation Summary</h2>
        {isLoading ? (
          <Loading message="Loading salary details..." />
        ) : salary && salary.baseSalary > 0 ? (
          <div className="space-y-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryItem label="Salary Structure" value={salary.structureName ?? '—'} />
              <SummaryItem
                label="Basic Salary (Monthly)"
                value={`₹${salary.baseSalary.toLocaleString('en-IN')}`}
                highlight
              />
              <SummaryItem
                label="Annual CTC"
                value={breakdown ? `₹${breakdown.annualCtc.toLocaleString('en-IN')}` : '—'}
              />
              <SummaryItem
                label="Net Take-Home"
                value={breakdown ? `₹${breakdown.netTakeHome.toLocaleString('en-IN')}` : '—'}
              />
              {salary.effectiveFrom ? (
                <SummaryItem
                  label="Effective From"
                  value={new Date(salary.effectiveFrom).toLocaleDateString()}
                />
              ) : null}
              <SummaryItem
                label="Status"
                value={
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      salary.isLocked ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800',
                    )}
                  >
                    {salary.isLocked ? 'Locked' : 'Active'}
                  </span>
                }
              />
            </dl>

            {breakdown ? <CtcBreakdownPanel breakdown={breakdown} /> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Salary information is not available yet. Contact HR to assign your compensation structure.
          </p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">My Payslips</h2>
        <PayslipList ownOnly />
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Questions about your salary?{' '}
        <Link to={ROUTES.WORKSPACE_HIERARCHY} className="text-primary hover:underline">
          View your reporting line
        </Link>
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border p-4', highlight && 'border-primary/30 bg-primary/5')}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
