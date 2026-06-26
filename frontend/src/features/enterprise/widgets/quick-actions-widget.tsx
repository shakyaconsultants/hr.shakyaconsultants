import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { ENTERPRISE_QUICK_ACTIONS } from '@/features/enterprise/constants/quick-actions';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';

export function QuickActionCenter({ className }: { className?: string }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const actions = ENTERPRISE_QUICK_ACTIONS.filter((action) => {
    if (action.permission) {
      return hasPermission(action.permission);
    }
    if (action.permissionsAny) {
      return hasAnyPermission(action.permissionsAny);
    }
    return true;
  });

  if (actions.length === 0) {
    return null;
  }

  return (
    <section className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Quick Action Center</h2>
          <p className="text-sm text-muted-foreground">
            Launch existing setup flows and creation wizards — no duplicate forms.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.path}
              className="group flex items-start gap-3 rounded-lg border bg-background p-4 transition hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/15">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function QuickActionsWidget() {
  return <QuickActionCenter />;
}
