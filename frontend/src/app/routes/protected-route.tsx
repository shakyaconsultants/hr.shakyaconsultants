import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/app.store';
import { ROUTES } from '@/config/app.config';
import { Loading } from '@/shared/components/loading';

interface ProtectedRouteProps {
  permission?: string;
  permissionsAny?: string[];
}

export function ProtectedRoute({ permission, permissionsAny }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading message="Securing your session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  if (permissionsAny && !hasAnyPermission(permissionsAny)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <Outlet />;
}
