import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Download, Plus, Search, UserCheck, Users, UserX } from 'lucide-react';
import { useEmployees, useExportEmployees } from '@/features/employee/hooks/use-employees';
import { EmployeeCreateDialog } from '@/features/employee/components/employee-create-dialog';
import { DataTable } from '@/shared/components/data-table';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { PageHeader } from '@/shared/components/page-header';
import { EntityStatusBadge } from '@/shared/components/entity-status-badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';
import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import { useAuthStore } from '@/shared/stores/app.store';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { cn } from '@/shared/utils/cn';

type StatusFilter = '' | 'active' | 'inactive';

const STATUS_FILTERS: {
  id: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: '', label: 'All', icon: Users },
  { id: 'active', label: 'Active', icon: UserCheck },
  { id: 'inactive', label: 'Inactive', icon: UserX },
];

function employeeInitials(row: EmployeeRecord): string {
  const first = row.firstName?.charAt(0) ?? '';
  const last = row.lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

function EmployeeAvatar({ row }: { row: EmployeeRecord }) {
  const initials = employeeInitials(row);
  return row.photoUrl ? (
    <img
      src={row.photoUrl}
      alt=""
      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-background"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary ring-1 ring-inset ring-secondary/15">
      {initials}
    </div>
  );
}

export function EmployeesListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('employee.create');
  const canExport = hasPermission('employee.read');

  const { data, isLoading, isError, error, refetch } = useEmployees({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });
  const exportMutation = useExportEmployees();

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate) {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, canCreate]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalEmployees = data?.pagination?.total ?? data?.items.length ?? 0;

  const activeOnPage = useMemo(
    () => (data?.items ?? []).filter((row) => row.status === 'active').length,
    [data?.items],
  );

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row: EmployeeRecord) => (
        <div className="flex items-center gap-3">
          <EmployeeAvatar row={row} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {`${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || '—'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeNumber',
      header: 'Employee ID',
      render: (row: EmployeeRecord) => (
        <Link
          to={ROUTES.employeeDetail(row.id)}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex rounded border border-border bg-muted/50 px-2 py-1 font-mono text-data font-medium text-secondary hover:bg-secondary/10"
        >
          {row.employeeNumber}
        </Link>
      ),
    },
    {
      key: 'role',
      header: 'Role & Department',
      render: (row: EmployeeRecord) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.designationName ?? '—'}</p>
          <p className="truncate text-xs text-muted-foreground">{row.departmentName ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'employmentStatus',
      header: 'Employment',
      render: (row: EmployeeRecord) => <EntityStatusBadge status={row.employmentStatus} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: EmployeeRecord) => <EntityStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  async function handleExport() {
    const blob = await exportMutation.mutateAsync({
      search: search || undefined,
      status: statusFilter || undefined,
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'employees.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Users className="h-6 w-6" />}
        title="Employees"
        description="Manage employee records, profiles, and employment details."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          ) : undefined
        }
      />

      <div className="erp-toolbar">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              placeholder="Search by name, email, or employee ID…"
              className="h-9 pl-9"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{totalEmployees}</span> total
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-semibold text-emerald-600">{activeOnPage}</span> active
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-semibold text-foreground">{data?.items.length ?? 0}</span>{' '}
                shown
              </span>
            </div>
            {STATUS_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = statusFilter === filter.id;
              return (
                <Button
                  key={filter.id || 'all'}
                  type="button"
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className={cn('h-8 gap-1.5', isActive && 'shadow-sm')}
                  onClick={() => setStatusFilter(filter.id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {filter.label}
                </Button>
              );
            })}
            {canExport ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={exportMutation.isPending}
                onClick={() => void handleExport()}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

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
          emptyTitle="No employees found"
          emptyMessage="Add your first employee or adjust your search and filters."
          emptyAction={
            canCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            ) : undefined
          }
          onRowClick={(row) => {
            if (isValidEntityId(row.id)) {
              navigate(ROUTES.employeeDetail(row.id));
            }
          }}
          pagination={
            data?.pagination && data.pagination.totalPages > 1
              ? {
                  page: data.pagination.page,
                  totalPages: data.pagination.totalPages,
                  total: data.pagination.total,
                  pageSize: data.pagination.pageSize,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </PageDataBoundary>

      {canCreate ? <EmployeeCreateDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </div>
  );
}
