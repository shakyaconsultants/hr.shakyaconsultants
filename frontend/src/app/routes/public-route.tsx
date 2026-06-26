import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/app.store';
import { usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';
import { Loading } from '@/shared/components/loading';

export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const portalHome = usePortalHomeRoute();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading message="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={portalHome} replace />;
  }

  return <Outlet />;
}
