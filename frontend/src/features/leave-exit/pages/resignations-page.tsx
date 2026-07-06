import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function ResignationsPage() {
  return <Navigate to={`${ROUTES.LEAVE_OFFBOARDING}?tab=resignations`} replace />;
}
