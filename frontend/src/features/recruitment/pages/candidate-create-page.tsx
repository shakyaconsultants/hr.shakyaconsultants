import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

export function CandidateCreatePage() {
  return <Navigate to={`${ROUTES.RECRUITMENT_CANDIDATES}?action=create`} replace />;
}
