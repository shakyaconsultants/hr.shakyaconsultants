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

const PORTAL_HOME_PATHS = [ROUTES.ENTERPRISE, ROUTES.MANAGER, ROUTES.WORKSPACE] as const;

export function PortalGuard() {
  const location = useLocation();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const portal = useMemo(
    () => resolvePortal(hasAnyPermission),
    [hasAnyPermission],
  );

  const homeRoute = getPortalHomeRoute(portal);

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
    return <Navigate to={homeRoute} replace />;
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
