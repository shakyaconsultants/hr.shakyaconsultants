import { useMemo } from 'react';
import {
  applyNavigationOverrides,
  buildNavigationForPortal,
  DEFAULT_FEATURE_FLAGS,
} from '@/config/module-registry';
import type { ModuleNavGroup } from '@/config/module-registry/types';
import type { PortalType } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';

/** Session navigation from auth — no network requests. */
export function useMergedNavigation(portal: PortalType): ModuleNavGroup[] {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const featureFlags = useAuthStore((s) => s.featureFlags);
  const navigationOverrides = useAuthStore((s) => s.navigation);

  return useMemo(() => {
    const base = buildNavigationForPortal({
      portal,
      hasPermission,
      hasAnyPermission,
      featureFlags: Object.keys(featureFlags).length > 0 ? featureFlags : DEFAULT_FEATURE_FLAGS,
    });

    if (!navigationOverrides.length) {
      return base;
    }

    return applyNavigationOverrides(base, navigationOverrides);
  }, [portal, hasPermission, hasAnyPermission, featureFlags, navigationOverrides]);
}
