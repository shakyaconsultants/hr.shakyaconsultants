import { useMemo } from 'react';
import { resolvePortal, getPortalHomeRoute } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';

export function useResolvedPortal() {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  return useMemo(() => resolvePortal(hasAnyPermission), [hasAnyPermission]);
}

export function usePortalHomeRoute() {
  const portal = useResolvedPortal();
  return getPortalHomeRoute(portal);
}
