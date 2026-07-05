import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { Loading } from '@/shared/components/loading';

/** HR compensation is managed per employee profile and in Payroll admin — no separate tab. */
export function PayrollHrPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(ROUTES.PAYROLL_ADMIN, { replace: true });
  }, [navigate]);

  return <Loading message="Redirecting to payroll administration..." />;
}
