import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function EmployeeCreatePage() {
  return <Navigate to={`${ROUTES.EMPLOYEES}?action=create`} replace />;
}
