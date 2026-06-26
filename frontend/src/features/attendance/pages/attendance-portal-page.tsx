import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, resolvePortal } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function AttendancePortalPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  useEffect(() => {
    if (hasPermission('attendance.update') || hasPermission('settings.manage')) {
      navigate(ROUTES.ATTENDANCE_ADMIN, { replace: true });
      return;
    }
    if (hasPermission('attendance.approve')) {
      navigate(ROUTES.ATTENDANCE_HR, { replace: true });
      return;
    }
    const portal = resolvePortal(hasAnyPermission);
    if (portal === PORTAL.MANAGER && hasPermission('attendance.read')) {
      navigate(ROUTES.ATTENDANCE_TEAM, { replace: true });
      return;
    }
    navigate(ROUTES.WORKSPACE_ATTENDANCE, { replace: true });
  }, [navigate, hasPermission, hasAnyPermission]);

  return <Loading message="Redirecting to attendance..." />;
}
