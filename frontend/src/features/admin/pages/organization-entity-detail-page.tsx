import { useParams } from 'react-router-dom';
import { DepartmentDetailPage } from '@/features/admin/pages/department-detail-page';
import { JobRoleDetailPage } from '@/features/admin/pages/job-role-detail-page';

export function OrganizationEntityDetailPage() {
  const { entityKey } = useParams<{ entityKey: string }>();

  if (entityKey === 'department') {
    return <DepartmentDetailPage />;
  }

  if (entityKey === 'job-role') {
    return <JobRoleDetailPage />;
  }

  return (
    <p className="text-muted-foreground">
      Detail view is not available for this entity type. Use the list page to manage records.
    </p>
  );
}
