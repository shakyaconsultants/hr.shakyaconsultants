import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listEntities } from '@/features/organization/api/organization.api';
import { ROUTES } from '@/config/app.config';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';

/** Compensation bands (salary grades) — managed inside Payroll, linked to designations. */
export function PayrollGradeBandsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['organization', 'salary-grade', 'list'],
    queryFn: () => listEntities('salary-grade', { pageSize: 100, status: 'active' }),
  });

  if (isLoading) return <Loading message="Loading compensation bands..." />;

  const grades = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Compensation bands</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Salary grades define min–max pay ranges for designations. They are not separate from payroll — use them
            when assigning structures so HR stays consistent across roles.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.organizationEntity('salary-grade')}>Manage bands</Link>
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'name', header: 'Band name' },
          {
            key: 'minSalary',
            header: 'Min salary',
            render: (row) => (row.minSalary != null ? Number(row.minSalary).toLocaleString('en-IN') : '—'),
          },
          {
            key: 'maxSalary',
            header: 'Max salary',
            render: (row) => (row.maxSalary != null ? Number(row.maxSalary).toLocaleString('en-IN') : '—'),
          },
          {
            key: 'level',
            header: 'Level',
            render: (row) => (row.level != null ? String(row.level) : '—'),
          },
        ]}
        data={grades}
        emptyMessage="No compensation bands yet. Create bands to map designations to pay ranges."
      />
    </div>
  );
}
