import { useParams, Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { EntityAdminPage } from '@/features/admin/components/entity-admin-page';
import { DepartmentListPage } from '@/features/organization/departments/department-list-page';
import { DesignationListPage } from '@/features/organization/designations/designation-list-page';
import { WorkShiftListPage } from '@/features/organization/work-shifts/work-shift-list-page';
import { HolidayListPage } from '@/features/organization/holidays/holiday-list-page';

export function EntityListPage() {
  const { entityKey = '' } = useParams<{ entityKey: string }>();

  if (entityKey === 'leave-type') {
    return <Navigate to={`${ROUTES.LEAVE_SETUP}?tab=types`} replace />;
  }

  if (entityKey === 'department') {
    return <DepartmentListPage />;
  }

  if (entityKey === 'designation') {
    return <DesignationListPage />;
  }

  if (entityKey === 'work-shift') {
    return <WorkShiftListPage />;
  }

  if (entityKey === 'holiday') {
    return <HolidayListPage />;
  }

  return <EntityAdminPage entityKey={entityKey as MasterEntityKey} />;
}
