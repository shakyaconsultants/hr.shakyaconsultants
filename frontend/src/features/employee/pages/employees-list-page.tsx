import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Plus, Users } from 'lucide-react';
import { useEmployees, useExportEmployees } from '@/features/employee/hooks/use-employees';
import { EmployeeCreateDialog } from '@/features/employee/components/employee-create-dialog';
import { DataTable } from '@/shared/components/data-table';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';
import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/app.store';

export function EmployeesListPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('employee.create');
  const canExport = hasPermission('employee.read');
  const { data, isLoading, isError, error, refetch } = useEmployees({ search: search || undefined, pageSize: 50 });
  const exportMutation = useExportEmployees();

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate) {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, canCreate]);

  const columns = [
    {
      key: 'employeeNumber',
      header: 'ID',
      render: (row: EmployeeRecord) => (
        <Link to={ROUTES.employeeDetail(row.id)} className="font-mono text-primary hover:underline">
          {row.employeeNumber}
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: EmployeeRecord) => `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || '—',
    },
    { key: 'email', header: 'Email' },
    { key: 'employmentStatus', header: 'Employment' },
    { key: 'status', header: 'Status' },
  ];

  async function handleExport() {
    const blob = await exportMutation.mutateAsync({});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'employees.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title="Employees"
        description="Manage employee records, profiles, and employment details."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={
          <div className="flex gap-2">
            {canExport ? (
              <Button variant="outline" onClick={() => void handleExport()} disabled={exportMutation.isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            ) : null}
            {canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            ) : null}
          </div>
        }
      />

      <Input
        placeholder="Search by name, email, or employee number..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />

      <PageDataBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        source="employees-list"
      >
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyTitle="No employees yet"
          emptyMessage="Add your first employee or adjust search filters."
          emptyAction={
            canCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            ) : undefined
          }
          onRowClick={(row) => navigate(ROUTES.employeeDetail(row.id))}
        />
      </PageDataBoundary>

      {canCreate ? <EmployeeCreateDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </div>
  );
}
