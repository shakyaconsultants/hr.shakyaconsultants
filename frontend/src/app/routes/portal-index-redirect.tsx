import { Navigate } from 'react-router-dom';
import { usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';

export function PortalIndexRedirect() {
  const homeRoute = usePortalHomeRoute();
  return <Navigate to={homeRoute} replace />;
}
