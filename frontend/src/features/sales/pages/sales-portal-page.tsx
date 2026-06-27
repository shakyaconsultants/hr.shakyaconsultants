import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, resolvePortal } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function SalesPortalPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    const portal = resolvePortal(hasAnyPermission);

    if (hasPermission('pipeline.update') || hasPermission('settings.manage')) {
      navigate(ROUTES.SALES_ADMIN, { replace: true });
      return;
    }
    if (portal === PORTAL.ENTERPRISE && hasPermission('lead.read')) {
      navigate(ROUTES.SALES_REPORTS, { replace: true });
      return;
    }
    if (portal === PORTAL.MANAGER && hasPermission('lead.read')) {
      navigate(ROUTES.SALES_MANAGER, { replace: true });
      return;
    }
    if (portal === PORTAL.WORKSPACE && hasPermission('lead.read')) {
      navigate(ROUTES.SALES_EXECUTIVE, { replace: true });
      return;
    }
    navigate(ROUTES.FORBIDDEN, { replace: true });
  }, [navigate, hasPermission, hasAnyPermission, isInitialized, isLoading]);

  return <Loading message="Redirecting to sales CRM..." />;
}
