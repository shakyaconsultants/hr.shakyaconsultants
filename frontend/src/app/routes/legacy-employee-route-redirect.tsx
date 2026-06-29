import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL } from '@/config/portals';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';

/** Redirect legacy employee leave paths to workspace-scoped routes. */
export function LegacyEmployeeLeaveRedirect({ target }: { target: string }) {
  const portal = useResolvedPortal();

  if (portal === PORTAL.WORKSPACE) {
    return <Navigate to={target} replace />;
  }

  return <Navigate to={ROUTES.FORBIDDEN} replace />;
}
