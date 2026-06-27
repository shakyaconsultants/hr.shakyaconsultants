import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { useAuthStore } from '@/shared/stores/app.store';
import { ROUTES } from '@/config/app.config';

interface ProtectedRouteProps {
  permission?: string;
  permissionsAny?: string[];
}

export function ProtectedRoute({ permission, permissionsAny }: ProtectedRouteProps) {
  const authStatus = useAuthStore((s) => s.authStatus);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const location = useLocation();

  if (authStatus === AUTH_STATUS.UNAUTHENTICATED) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  if (authStatus === AUTH_STATUS.AUTHENTICATED) {
    if (permission && !hasPermission(permission)) {
      return <Navigate to={ROUTES.FORBIDDEN} replace />;
    }

    if (permissionsAny && !hasAnyPermission(permissionsAny)) {
      return <Navigate to={ROUTES.FORBIDDEN} replace />;
    }
  }

  return <Outlet />;
}
