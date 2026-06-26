import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface TrendDataPoint {
  label: string;
  value: number;
}

export interface TrendWidgetProps {
  title?: string;
  data: TrendDataPoint[];
  currentValue?: number;
  previousValue?: number;
  unit?: string;
}

export function TrendWidget({ title, data, currentValue, previousValue, unit = '' }: TrendWidgetProps) {
  const latest = currentValue ?? data[data.length - 1]?.value ?? 0;
  const previous = previousValue ?? data[data.length - 2]?.value ?? 0;
  const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold">
            {latest.toLocaleString()}
            {unit}
          </p>
          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {isPositive ? '+' : ''}
              {change.toFixed(1)}% vs prior period
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-1" style={{ height: 64 }}>
        {data.map((point) => {
          const height = Math.max((point.value / maxValue) * 56, 4);
          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-primary/70" style={{ height }} title={`${point.label}: ${point.value}`} />
              <span className="truncate text-[9px] text-muted-foreground">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
