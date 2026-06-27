import { useParams } from 'react-router-dom';
import { DepartmentDetailPage } from '@/features/organization/departments/department-detail-page';
import { DesignationDetailPage } from '@/features/organization/designations/designation-detail-page';
import { JobRoleDetailPage } from '@/features/admin/pages/job-role-detail-page';

export function OrganizationEntityDetailPage() {
  const { entityKey } = useParams<{ entityKey: string }>();

  if (entityKey === 'department') {
    return <DepartmentDetailPage />;
  }

  if (entityKey === 'job-role') {
    return <JobRoleDetailPage />;
  }

  if (entityKey === 'designation') {
    return <DesignationDetailPage />;
  }

  return (
    <p className="text-muted-foreground">
      Detail view is not available for this entity type. Use the list page to manage records.
    </p>
  );
}
