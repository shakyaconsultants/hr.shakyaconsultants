import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function ExitProgressPage() {
  return <Navigate to={`${ROUTES.LEAVE_OFFBOARDING}?tab=exit`} replace />;
}
