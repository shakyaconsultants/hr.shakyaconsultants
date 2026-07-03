import { cn } from '@/shared/utils/cn';
import type { CtcBreakdown } from '@/features/payroll/utils/ctc-breakdown.util';
import { formatInr } from '@/features/payroll/utils/ctc-breakdown.util';

interface CtcBreakdownPanelProps {
  breakdown: CtcBreakdown;
  compact?: boolean;
  className?: string;
}

function SectionTable({
  title,
  rows,
  totalLabel,
  totalAmount,
  currency,
  highlight = false,
}: {
  title: string;
  rows: Array<{ name: string; amount: number; isVariable?: boolean; note?: string }>;
  totalLabel?: string;
  totalAmount?: number;
  currency: string;
  highlight?: boolean;
}) {
  if (rows.length === 0 && totalAmount === undefined) return null;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/40 px-4 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b last:border-b-0">
              <td className="px-4 py-2.5">
                <span className="font-medium">{row.name}</span>
                {row.isVariable ? (
                  <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">*</span>
                ) : null}
                {row.note ? <p className="text-xs text-muted-foreground">{row.note}</p> : null}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {formatInr(row.amount, currency)}
              </td>
            </tr>
          ))}
          {totalLabel !== undefined && totalAmount !== undefined ? (
            <tr className={cn(highlight && 'bg-primary/5 font-semibold')}>
              <td className="px-4 py-3">{totalLabel}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatInr(totalAmount, currency)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function CtcBreakdownPanel({ breakdown, compact = false, className }: CtcBreakdownPanelProps) {
  const { currency } = breakdown;

  return (
    <div className={cn('space-y-4', className)}>
      {!compact ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Monthly Gross" value={formatInr(breakdown.grossSalary, currency)} />
          <SummaryTile label="Net Take-Home" value={formatInr(breakdown.netTakeHome, currency)} accent />
          <SummaryTile label="Annual CTC" value={formatInr(breakdown.annualCtc, currency)} />
        </div>
      ) : null}

      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'lg:grid-cols-2')}>
        <SectionTable
          title="Fixed Earnings (Monthly)"
          rows={breakdown.fixedEarnings.map((item) => ({
            name: item.name,
            amount: item.amount,
            note: item.note,
          }))}
          currency={currency}
        />

        {breakdown.variableEarnings.length > 0 ? (
          <SectionTable
            title="Variable Earnings *"
            rows={breakdown.variableEarnings.map((item) => ({
              name: item.name,
              amount: item.amount,
              isVariable: true,
              note: item.note,
            }))}
            currency={currency}
          />
        ) : null}

        <SectionTable
          title="Employee Deductions"
          rows={breakdown.deductions.map((item) => ({
            name: item.name,
            amount: item.amount,
            note: item.note,
          }))}
          totalLabel="Total Deductions"
          totalAmount={breakdown.totalDeductions}
          currency={currency}
        />

        <SectionTable
          title="Employer Contributions (CTC)"
          rows={breakdown.employerContributions.map((item) => ({
            name: item.name,
            amount: item.amount,
            note: item.note,
          }))}
          totalLabel="Monthly CTC"
          totalAmount={breakdown.monthlyCtc}
          currency={currency}
          highlight
        />
      </div>

      <p className="text-xs text-muted-foreground">
        * Variable components depend on attendance, performance, or policy. Statutory rates (PF, gratuity, ESI, PT)
        follow standard India payroll practice; verify against your state and company policy.
      </p>
    </div>
  );
}

function SummaryTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3',
        accent ? 'border-primary/30 bg-primary/5' : 'bg-card',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
