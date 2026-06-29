import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';
import { resolveSalesHubRoute } from '@/app/utils/portal-hub.util';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function SalesPortalPage() {
  const navigate = useNavigate();
  const portal = useResolvedPortal();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const authStatus = useAuthStore((s) => s.authStatus);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return;
    }
    navigate(resolveSalesHubRoute(portal, hasPermission), { replace: true });
  }, [navigate, portal, hasPermission, authStatus]);

  return <Loading message="Redirecting to sales CRM..." />;
}
