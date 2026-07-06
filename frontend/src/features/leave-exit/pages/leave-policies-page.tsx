import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function LeavePoliciesPage() {
  return <Navigate to={`${ROUTES.LEAVE_SETUP}?tab=policies`} replace />;
}
