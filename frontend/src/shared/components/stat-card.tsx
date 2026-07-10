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
    <div className={cn('erp-card p-4', className)}>
      {Icon ? (
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-secondary" />
          <span className="text-label-caps text-muted-foreground">{label}</span>
        </div>
      ) : (
        <p className="text-label-caps text-muted-foreground">{label}</p>
      )}
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-data text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
