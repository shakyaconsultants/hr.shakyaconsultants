import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { getEntity } from '@/features/organization/api/organization.api';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function DepartmentDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: department, isLoading } = useQuery({
    queryKey: ['organization', 'department', id],
    queryFn: () => getEntity('department', id),
    enabled: Boolean(id),
  });
  const { data: children } = useMasterDataList('department', { page: 1, pageSize: 50, status: 'active' });
  const childDepartments = (children?.items ?? []).filter((item) => item.parentDepartmentId === id);

  if (isLoading) {
    return <Loading message="Loading department..." />;
  }

  if (!department) {
    return <p className="text-destructive">Department not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title={department.name}
        description={String(department.description ?? 'Department administration overview')}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.organizationEntity('department')}>All Departments</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Employees" value={Number(department.employeeCount ?? 0)} />
        <StatCard label="Open Positions" value={Number(department.openPositions ?? 0)} />
        <StatCard label="Child Departments" value={childDepartments.length} />
        <StatCard label="Status" value={String(department.status ?? '—')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Hierarchy</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Parent</dt><dd>{String(department.parentDepartmentId ?? '—')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Branch</dt><dd>{String(department.branchId ?? '—')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Head</dt><dd>{String(department.headEmployeeId ?? '—')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Cost Center</dt><dd>{String(department.costCenterCode ?? '—')}</dd></div>
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.EMPLOYEES}>View Employees</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.RECRUITMENT}>Recruitment</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to={ROUTES.organizationEntity('job-role')}>Job Roles</Link></Button>
          </div>
        </section>
      </div>

      {childDepartments.length > 0 ? (
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Sub-departments</h2>
          <ul className="space-y-2 text-sm">
            {childDepartments.map((child) => (
              <li key={child.id}>
                <Link to={ROUTES.organizationEntityDetail('department', child.id)} className="text-primary hover:underline">
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
