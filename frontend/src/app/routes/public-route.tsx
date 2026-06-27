import { Navigate, Outlet } from 'react-router-dom';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { useAuthStore } from '@/shared/stores/app.store';
import { usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';

export function PublicRoute() {
  const authStatus = useAuthStore((s) => s.authStatus);
  const portalHome = usePortalHomeRoute();

  if (authStatus === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to={portalHome} replace />;
  }

  return <Outlet />;
}
