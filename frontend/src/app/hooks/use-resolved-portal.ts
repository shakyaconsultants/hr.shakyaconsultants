import { useAuthStore } from '@/shared/stores/app.store';
import { resolvePortal, getPortalHomeRoute, type PortalType } from '@/config/portals';

export function useResolvedPortal(): PortalType {
  const sessionPortal = useAuthStore((s) => s.portal);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  if (sessionPortal) {
    return sessionPortal;
  }

  return resolvePortal(hasAnyPermission);
}

export function usePortalHomeRoute(): string {
  const homeRoute = useAuthStore((s) => s.homeRoute);
  const portal = useResolvedPortal();
  return homeRoute ?? getPortalHomeRoute(portal);
}
