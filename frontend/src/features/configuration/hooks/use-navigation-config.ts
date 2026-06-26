import { useMemo } from 'react';
import {
  applyNavigationOverrides,
  buildNavigationForPortal,
} from '@/config/module-registry';
import type { ModuleNavGroup } from '@/config/module-registry/types';
import type { PortalType } from '@/config/portals';
import { useFeatureFlags } from '@/features/admin/hooks/use-settings';
import { useNavigationConfig as useNavigationConfigQuery } from '@/features/configuration/hooks/use-configuration';
import { useAuthStore } from '@/shared/stores/app.store';

export function useMergedNavigation(portal: PortalType): ModuleNavGroup[] {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const { data: featureFlags } = useFeatureFlags();
  const { data: navConfig } = useNavigationConfigQuery();

  return useMemo(() => {
    const base = buildNavigationForPortal({
      portal,
      hasPermission,
      hasAnyPermission,
      featureFlags: featureFlags ?? undefined,
    });

    if (!navConfig?.items?.length) {
      return base;
    }

    return applyNavigationOverrides(base, navConfig.items);
  }, [portal, hasPermission, hasAnyPermission, featureFlags, navConfig]);
}
