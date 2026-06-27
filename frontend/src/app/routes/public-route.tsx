import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/app.store';
import { usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';
import { Loading } from '@/shared/components/loading';

export function PublicRoute() {
  const authStatus = useAuthStore((s) => s.authStatus);
  const portalHome = usePortalHomeRoute();

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading message="Loading..." />
      </div>
    );
  }

  if (authStatus === 'authenticated') {
    return <Navigate to={portalHome} replace />;
  }

  return <Outlet />;
}
