import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';

const NAV_ITEMS = [
  { label: 'Apply Leave', path: ROUTES.WORKSPACE_LEAVE_APPLY, permission: 'leave.create' },
  { label: 'My Requests', path: ROUTES.WORKSPACE_LEAVE_REQUESTS, permission: 'leave.read' },
  { label: 'My Balance', path: ROUTES.WORKSPACE_LEAVE_BALANCE, permission: 'leave.balance.read' },
  { label: 'Resignation', path: ROUTES.WORKSPACE_RESIGNATION, permission: 'resignation.read' },
] as const;

export function WorkspaceLeaveNav() {
  const location = useLocation();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px">
      {visibleItems.map((item) => {
        const isActive =
          location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border border-b-0 border-border bg-card text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
