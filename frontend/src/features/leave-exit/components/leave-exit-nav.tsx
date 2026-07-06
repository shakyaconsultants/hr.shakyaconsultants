import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, type PortalType } from '@/config/portals';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';

type NavItem = {
  label: string;
  path: string;
  matchPaths?: string[];
  permission?: string;
  permissionsAny?: string[];
  portals?: PortalType[];
};

const ENTERPRISE_NAV: NavItem[] = [
  {
    label: 'Overview',
    path: ROUTES.LEAVE_EXIT,
    permissionsAny: ['leave.read', 'resignation.read'],
  },
  {
    label: 'Setup',
    path: ROUTES.LEAVE_SETUP,
    matchPaths: [
      ROUTES.LEAVE_SETUP,
      ROUTES.LEAVE_POLICIES,
      ROUTES.organizationEntity('leave-type'),
    ],
    permissionsAny: ['leave-type.read', 'leave.policy.read'],
    portals: [PORTAL.ENTERPRISE],
  },
  { label: 'Requests', path: ROUTES.LEAVE_REQUESTS, permission: 'leave.read' },
  {
    label: 'Balances',
    path: ROUTES.LEAVE_BALANCES,
    permission: 'leave.balance.read',
    portals: [PORTAL.ENTERPRISE],
  },
  { label: 'Calendar', path: ROUTES.LEAVE_CALENDAR, permission: 'leave.calendar.read' },
  {
    label: 'Offboarding',
    path: ROUTES.LEAVE_OFFBOARDING,
    matchPaths: [ROUTES.LEAVE_OFFBOARDING, ROUTES.RESIGNATION, ROUTES.EXIT],
    permissionsAny: ['resignation.read', 'exit.read'],
    portals: [PORTAL.ENTERPRISE],
  },
];

const MANAGER_NAV: NavItem[] = [
  { label: 'Overview', path: ROUTES.LEAVE_EXIT, permissionsAny: ['leave.read', 'leave.approve'] },
  {
    label: 'Team Requests',
    path: ROUTES.LEAVE_REQUESTS,
    permissionsAny: ['leave.read', 'leave.approve'],
  },
  { label: 'Team Calendar', path: ROUTES.LEAVE_CALENDAR, permission: 'leave.calendar.read' },
];

function navForPortal(portal: PortalType): NavItem[] {
  if (portal === PORTAL.ENTERPRISE) return ENTERPRISE_NAV;
  if (portal === PORTAL.MANAGER) return MANAGER_NAV;
  return [];
}

function canSeeNavItem(
  item: NavItem,
  portal: PortalType,
  hasPermission: (code: string) => boolean,
  hasAnyPermission: (codes: string[]) => boolean,
): boolean {
  if (item.portals && !item.portals.includes(portal)) return false;
  if (item.permission) return hasPermission(item.permission);
  if (item.permissionsAny) return hasAnyPermission(item.permissionsAny);
  return true;
}

function isNavActive(item: NavItem, pathname: string): boolean {
  const paths = item.matchPaths ?? [item.path];
  return paths.some(
    (path) => pathname === path || (path !== ROUTES.LEAVE_EXIT && pathname.startsWith(`${path}/`)),
  );
}

export function LeaveExitNav() {
  const location = useLocation();
  const portal = useResolvedPortal();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const visibleItems = navForPortal(portal).filter((item) =>
    canSeeNavItem(item, portal, hasPermission, hasAnyPermission),
  );

  if (visibleItems.length === 0) return null;

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px">
      {visibleItems.map((item) => {
        const isActive = isNavActive(item, location.pathname);
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

export function LeaveExitPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
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

  return (
    <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export { StatusBadge };
