import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, hint, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      {Icon ? (
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
      ) : (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
