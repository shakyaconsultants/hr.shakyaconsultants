import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, resolvePortal, type PortalType } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';

const NAV_ITEMS: Array<{
  label: string;
  path: string;
  portals: PortalType[];
  permission?: string;
}> = [
  { label: 'Overview', path: ROUTES.LEAVE_EXIT, portals: [PORTAL.ENTERPRISE, PORTAL.MANAGER, PORTAL.WORKSPACE] },
  { label: 'Apply Leave', path: ROUTES.LEAVE_APPLY, permission: 'leave.apply', portals: [PORTAL.WORKSPACE, PORTAL.MANAGER] },
  { label: 'My Requests', path: ROUTES.LEAVE_REQUESTS, permission: 'leave.read', portals: [PORTAL.WORKSPACE, PORTAL.MANAGER, PORTAL.ENTERPRISE] },
  { label: 'Calendar', path: ROUTES.LEAVE_CALENDAR, permission: 'leave.read', portals: [PORTAL.WORKSPACE, PORTAL.MANAGER, PORTAL.ENTERPRISE] },
  { label: 'Balances', path: ROUTES.LEAVE_BALANCES, permission: 'leave.read', portals: [PORTAL.WORKSPACE, PORTAL.MANAGER] },
  { label: 'Policies', path: ROUTES.LEAVE_POLICIES, permission: 'leave.read', portals: [PORTAL.ENTERPRISE, PORTAL.MANAGER] },
  { label: 'Resignation', path: ROUTES.RESIGNATION, permission: 'resignation.create', portals: [PORTAL.WORKSPACE] },
  { label: 'Exit', path: ROUTES.EXIT, permission: 'exit.read', portals: [PORTAL.ENTERPRISE] },
  { label: 'Approvals', path: ROUTES.APPROVAL_INBOX, permission: 'approval.read', portals: [PORTAL.MANAGER] },
];

export function LeaveExitNav() {
  const location = useLocation();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const portal = resolvePortal(hasAnyPermission);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.portals.includes(portal)) {
      return false;
    }
    if ('permission' in item && item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px">
      {visibleItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== ROUTES.LEAVE_EXIT && location.pathname.startsWith(item.path));
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

export function LeaveExitPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'approved' || status === 'completed'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'rejected' || status === 'cancelled'
        ? 'bg-red-100 text-red-800'
        : status === 'pending' || status === 'in_progress'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-muted text-muted-foreground';

  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>{status.replace(/_/g, ' ')}</span>;
}

export { StatusBadge };
