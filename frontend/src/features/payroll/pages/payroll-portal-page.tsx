import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, resolvePortal } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function PayrollPortalPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const authStatus = useAuthStore((s) => s.authStatus);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return;
    }

    const portal = resolvePortal(hasAnyPermission);

    if (hasPermission('payroll.update') || hasPermission('settings.manage')) {
      navigate(ROUTES.PAYROLL_ADMIN, { replace: true });
      return;
    }
    if (portal === PORTAL.ENTERPRISE && hasPermission('payroll.read')) {
      navigate(ROUTES.PAYROLL_HR, { replace: true });
      return;
    }
    if (portal === PORTAL.MANAGER && hasPermission('payroll.process')) {
      navigate(ROUTES.PAYROLL_FINANCE, { replace: true });
      return;
    }
    if (portal === PORTAL.WORKSPACE && hasPermission('payslip.read')) {
      navigate(ROUTES.WORKSPACE_PAYROLL, { replace: true });
      return;
    }
    navigate(ROUTES.FORBIDDEN, { replace: true });
  }, [navigate, hasPermission, hasAnyPermission, authStatus]);

  return <Loading message="Redirecting to payroll..." />;
}
