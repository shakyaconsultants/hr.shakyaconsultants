import { Navigate, useLocation } from 'react-router-dom';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { ROUTES } from '@/config/app.config';
import { useResolvedPortal, usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';
import { PORTAL } from '@/config/portals';
import { isPathAllowedForPortal } from '@/config/module-registry';
import { EnterpriseLayout } from '@/app/layouts/enterprise-layout';
import { ManagerLayout } from '@/app/layouts/manager-layout';
import { WorkspaceLayout } from '@/app/layouts/workspace-layout';
import { useAuthStore } from '@/shared/stores/app.store';

const PORTAL_HOME_PATHS = [ROUTES.ENTERPRISE, ROUTES.MANAGER, ROUTES.WORKSPACE] as const;

export function PortalGuard() {
  const location = useLocation();
  const authStatus = useAuthStore((s) => s.authStatus);
  const permissions = useAuthStore((s) => s.permissions);
  const roles = useAuthStore((s) => s.roles);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);

  const portal = useResolvedPortal();
  const homeRoute = usePortalHomeRoute();

  if (authStatus === AUTH_STATUS.RESTORING) {
    return null;
  }

  if (authStatus === AUTH_STATUS.UNAUTHENTICATED) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  const sessionReady = isSuperAdmin() || permissions.length > 0 || roles.length > 0;
  if (!sessionReady) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }
  if (location.pathname === ROUTES.HOME) {
    return <Navigate to={homeRoute} replace />;
  }

  const superAdmin = isSuperAdmin();

  const wrongPortalLanding =
    (portal === PORTAL.ENTERPRISE &&
      (location.pathname === ROUTES.WORKSPACE || location.pathname === ROUTES.MANAGER)) ||
    (portal === PORTAL.MANAGER &&
      (location.pathname === ROUTES.WORKSPACE || location.pathname === ROUTES.ENTERPRISE)) ||
    (portal === PORTAL.WORKSPACE &&
      (location.pathname === ROUTES.ENTERPRISE || location.pathname === ROUTES.MANAGER));

  if (!superAdmin && wrongPortalLanding) {
    return <Navigate to={homeRoute} replace />;
  }

  if (
    !superAdmin &&
    PORTAL_HOME_PATHS.includes(location.pathname as (typeof PORTAL_HOME_PATHS)[number]) &&
    location.pathname !== homeRoute
  ) {
    return <Navigate to={homeRoute} replace />;
  }

  if (
    !superAdmin &&
    !isPathAllowedForPortal(location.pathname, portal, hasPermission, hasAnyPermission)
  ) {
    return <Navigate to={ROUTES.FORBIDDEN} replace state={{ from: location.pathname }} />;
  }

  switch (portal) {
    case PORTAL.ENTERPRISE:
      return <EnterpriseLayout />;
    case PORTAL.MANAGER:
      return <ManagerLayout />;
    default:
      return <WorkspaceLayout />;
  }
}
