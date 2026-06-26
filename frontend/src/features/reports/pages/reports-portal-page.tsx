import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function ReportsPortalPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  useEffect(() => {
    if (hasPermission('analytics.dashboard.read')) {
      navigate(ROUTES.REPORTS_EXECUTIVE, { replace: true });
      return;
    }
    if (hasPermission('analytics.report.read')) {
      navigate(ROUTES.ANALYTICS, { replace: true });
      return;
    }
    navigate(ROUTES.FORBIDDEN, { replace: true });
  }, [navigate, hasPermission]);

  return <Loading message="Redirecting to reports & analytics..." />;
}
