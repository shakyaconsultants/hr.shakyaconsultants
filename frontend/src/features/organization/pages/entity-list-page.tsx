import { useParams } from 'react-router-dom';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { EntityAdminPage } from '@/features/admin/components/entity-admin-page';

export function EntityListPage() {
  const { entityKey = '' } = useParams<{ entityKey: string }>();
  return <EntityAdminPage entityKey={entityKey as MasterEntityKey} />;
}
