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

  useEffect(() => {
    if (hasPermission('pipeline.update') || hasPermission('settings.manage')) {
      navigate(ROUTES.SALES_ADMIN, { replace: true });
      return;
    }
    const portal = resolvePortal(hasAnyPermission);
    if (portal === PORTAL.MANAGER && hasPermission('lead.read')) {
      navigate(ROUTES.SALES_MANAGER, { replace: true });
      return;
    }
    if (hasPermission('lead.read')) {
      navigate(ROUTES.SALES_EXECUTIVE, { replace: true });
      return;
    }
    navigate(ROUTES.FORBIDDEN, { replace: true });
  }, [navigate, hasPermission, hasAnyPermission]);

  return <Loading message="Redirecting to sales CRM..." />;
}
