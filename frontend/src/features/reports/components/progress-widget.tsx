import { cn } from '@/shared/utils/cn';

export interface ProgressItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export interface ProgressWidgetProps {
  title?: string;
  items: ProgressItem[];
}

export function ProgressWidget({ title, items }: ProgressWidgetProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No progress data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      {items.map((item) => {
        const max = item.max ?? 100;
        const percentage = max > 0 ? Math.min((item.value / max) * 100, 100) : 0;
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">
                {item.value.toLocaleString()} / {max.toLocaleString()} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-all', item.color ? undefined : 'bg-primary')}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
