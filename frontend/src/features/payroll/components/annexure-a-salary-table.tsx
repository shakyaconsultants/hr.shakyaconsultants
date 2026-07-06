import type { CtcBreakdown } from '@/features/payroll/utils/ctc-breakdown.util';
import { formatInr } from '@/features/payroll/utils/ctc-breakdown.util';

interface AnnexureASalaryTableProps {
  breakdown: CtcBreakdown;
  title?: string;
  subtitle?: string;
}

/** Contract-style Annexure A salary breakdown (Component | Monthly Amount). */
export function AnnexureASalaryTable({
  breakdown,
  title = 'Annexure A: Revised Salary Structure',
  subtitle = 'Monthly salary components (INR)',
}: AnnexureASalaryTableProps) {
  const earningRows = [...breakdown.fixedEarnings, ...breakdown.variableEarnings];

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-5 py-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20 text-left">
            <th className="px-5 py-3 font-semibold">Component</th>
            <th className="px-5 py-3 text-right font-semibold">Monthly Amount</th>
          </tr>
        </thead>
        <tbody>
          {earningRows.map((row) => (
            <tr key={row.code} className="border-b last:border-b-0">
              <td className="px-5 py-3">
                <span className="font-medium">{row.name}</span>
                {row.isVariable ? (
                  <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">*</span>
                ) : null}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {formatInr(row.amount, breakdown.currency)}
              </td>
            </tr>
          ))}
          <tr className="bg-primary/5 font-semibold">
            <td className="px-5 py-4">Total CTC (Monthly)</td>
            <td className="px-5 py-4 text-right tabular-nums">
              {formatInr(breakdown.monthlyCtc, breakdown.currency)}
            </td>
          </tr>
          <tr className="border-t bg-muted/10">
            <td className="px-5 py-3 text-muted-foreground">Annual CTC</td>
            <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
              {formatInr(breakdown.annualCtc, breakdown.currency)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="border-t px-5 py-3 text-xs text-muted-foreground">
        * Variable components depend on attendance and performance. Net take-home after deductions:{' '}
        <span className="font-medium text-foreground">
          {formatInr(breakdown.netTakeHome, breakdown.currency)}
        </span>
        / month.
      </p>
    </div>
  );
}
