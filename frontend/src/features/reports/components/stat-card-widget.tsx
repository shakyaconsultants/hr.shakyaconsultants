import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface StatCardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

export function StatCardWidget({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  className,
}: StatCardWidgetProps) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formatValue(value)}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {icon ? <div className="text-primary">{icon}</div> : null}
      </div>
      {trend !== undefined ? (
        <div
          className={cn(
            'mt-3 flex items-center gap-1 text-xs font-medium',
            trendPositive ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {trendPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>
            {trendPositive ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
          {trendLabel ? <span className="font-normal text-muted-foreground">{trendLabel}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
