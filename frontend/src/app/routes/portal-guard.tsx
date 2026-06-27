import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { ROUTES } from '@/config/app.config';
import {
  getPortalHomeRoute,
  PORTAL,
  resolvePortal,
} from '@/config/portals';
import { isPathAllowedForPortal } from '@/config/module-registry';
import { EnterpriseLayout } from '@/app/layouts/enterprise-layout';
import { ManagerLayout } from '@/app/layouts/manager-layout';
import { WorkspaceLayout } from '@/app/layouts/workspace-layout';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

const PORTAL_HOME_PATHS = [ROUTES.ENTERPRISE, ROUTES.MANAGER, ROUTES.WORKSPACE] as const;

export function PortalGuard() {
  const location = useLocation();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const permissions = useAuthStore((s) => s.permissions);
  const roles = useAuthStore((s) => s.roles);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);

  const portal = useMemo(
    () => resolvePortal(hasAnyPermission),
    [hasAnyPermission],
  );

  const homeRoute = getPortalHomeRoute(portal);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading message="Loading your workspace..." />
      </div>
    );
  }

  const sessionReady = isSuperAdmin() || permissions.length > 0 || roles.length > 0;
  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading message="Resolving permissions..." />
      </div>
    );
  }

  if (location.pathname === ROUTES.HOME) {
    return <Navigate to={homeRoute} replace />;
  }

  const wrongPortalLanding =
    (portal === PORTAL.ENTERPRISE && (location.pathname === ROUTES.WORKSPACE || location.pathname === ROUTES.MANAGER)) ||
    (portal === PORTAL.MANAGER && (location.pathname === ROUTES.WORKSPACE || location.pathname === ROUTES.ENTERPRISE)) ||
    (portal === PORTAL.WORKSPACE &&
      (location.pathname === ROUTES.ENTERPRISE || location.pathname === ROUTES.MANAGER));

  if (wrongPortalLanding) {
    return <Navigate to={homeRoute} replace />;
  }

  if (
    PORTAL_HOME_PATHS.includes(location.pathname as (typeof PORTAL_HOME_PATHS)[number]) &&
    location.pathname !== homeRoute
  ) {
    return <Navigate to={homeRoute} replace />;
  }

  if (!isPathAllowedForPortal(location.pathname, portal, hasPermission, hasAnyPermission)) {
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
