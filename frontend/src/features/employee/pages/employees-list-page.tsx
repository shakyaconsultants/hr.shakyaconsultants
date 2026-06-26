import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Plus, Users } from 'lucide-react';
import { useEmployees, useExportEmployees } from '@/features/employee/hooks/use-employees';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import type { EmployeeRecord } from '@/features/employee/api/employee.api';

export function EmployeesListPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useEmployees({ search: search || undefined, pageSize: 50 });
  const exportMutation = useExportEmployees();

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
      render: (row: EmployeeRecord) => `${row.firstName} ${row.lastName}`,
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

  if (isLoading) {
    return <Loading message="Loading employees..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Employees</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage employee records, profiles, and employment details.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link to={ROUTES.EMPLOYEE_CREATE}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search by name, email, or employee number..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />

      {isError && <p className="text-destructive">Failed to load employees. Ensure you are authenticated.</p>}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        onRowClick={(row) => navigate(ROUTES.employeeDetail(row.id))}
      />
    </div>
  );
}
