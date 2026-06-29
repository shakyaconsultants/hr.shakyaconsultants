import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, type PortalType } from '@/config/portals';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';

type NavItem = {
  label: string;
  path: string;
  permission?: string;
  permissionsAny?: string[];
};

const ADMIN_NAV: NavItem[] = [
  { label: 'Leave Management', path: ROUTES.LEAVE_EXIT, permissionsAny: ['leave.read', 'resignation.read'] },
  { label: 'All Requests', path: ROUTES.LEAVE_REQUESTS, permission: 'leave.read' },
  { label: 'Leave Calendar', path: ROUTES.LEAVE_CALENDAR, permission: 'leave.read' },
  { label: 'All Balances', path: ROUTES.LEAVE_BALANCES, permission: 'leave.read' },
  { label: 'Policies & Rules', path: ROUTES.LEAVE_POLICIES, permission: 'leave.read' },
  { label: 'Exit Management', path: ROUTES.EXIT, permission: 'exit.read' },
];

const HR_NAV: NavItem[] = [
  { label: 'Leave Management', path: ROUTES.LEAVE_EXIT, permissionsAny: ['leave.read', 'leave.approve'] },
  { label: 'Pending Requests', path: ROUTES.LEAVE_REQUESTS, permissionsAny: ['leave.read', 'leave.approve'] },
  { label: 'Team Calendar', path: ROUTES.LEAVE_CALENDAR, permission: 'leave.read' },
  { label: 'Approvals', path: ROUTES.APPROVAL_INBOX, permission: 'approval.read' },
];

function navForPortal(portal: PortalType): NavItem[] {
  if (portal === PORTAL.ENTERPRISE) {
    return ADMIN_NAV;
  }
  if (portal === PORTAL.MANAGER) {
    return HR_NAV;
  }
  return [];
}

function canSeeNavItem(
  item: NavItem,
  hasPermission: (code: string) => boolean,
  hasAnyPermission: (codes: string[]) => boolean,
): boolean {
  if (item.permission) {
    return hasPermission(item.permission);
  }
  if (item.permissionsAny) {
    return hasAnyPermission(item.permissionsAny);
  }
  return true;
}

export function LeaveExitNav() {
  const location = useLocation();
  const portal = useResolvedPortal();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const visibleItems = navForPortal(portal).filter((item) => canSeeNavItem(item, hasPermission, hasAnyPermission));

  if (visibleItems.length === 0) {
    return null;
  }

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
