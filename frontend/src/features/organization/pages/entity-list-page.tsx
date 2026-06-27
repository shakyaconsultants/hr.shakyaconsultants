import { useParams } from 'react-router-dom';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { EntityAdminPage } from '@/features/admin/components/entity-admin-page';
import { DepartmentListPage } from '@/features/organization/departments/department-list-page';
import { DesignationListPage } from '@/features/organization/designations/designation-list-page';

export function EntityListPage() {
  const { entityKey = '' } = useParams<{ entityKey: string }>();

  if (entityKey === 'department') {
    return <DepartmentListPage />;
  }

  if (entityKey === 'designation') {
    return <DesignationListPage />;
  }

  return <EntityAdminPage entityKey={entityKey as MasterEntityKey} />;
}
