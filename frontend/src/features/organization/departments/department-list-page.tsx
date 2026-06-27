import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import {
  fetchDepartmentStats,
  listDepartments,
  type DepartmentRecord,
} from '@/features/organization/departments/department.api';
import {
  DepartmentForm,
  departmentFormToPayload,
  recordToDepartmentForm,
  type DepartmentFormValue,
} from '@/features/organization/departments/department-form';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { EmployeeSearchSelect } from '@/shared/components/employee-search-select';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Sheet } from '@/shared/components/ui/sheet';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { FilterBar, FilterField } from '@/shared/components/filter-bar';
import { StatusFilterSelect } from '@/shared/components/status-filter-select';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { exportEntities } from '@/features/organization/api/organization.api';
import { useQuery } from '@tanstack/react-query';
import type { ApiErrorResponse } from '@/shared/types/api.types';

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'active'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'inactive'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-muted text-muted-foreground';

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{status}</span>;
}

export function DepartmentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [headFilter, setHeadFilter] = useState('');
  const [rootOnly, setRootOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<DepartmentRecord | null>(null);
  const [formValue, setFormValue] = useState<DepartmentFormValue>({ name: '', status: 'active' });
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      status: statusFilter || undefined,
      branchId: branchFilter || undefined,
      parentDepartmentId: rootOnly ? 'root' : parentFilter || undefined,
      headEmployeeId: headFilter || undefined,
      includeDeleted: showArchived || undefined,
      sortBy: 'name',
      sortOrder: 'asc' as const,
    }),
    [page, search, statusFilter, branchFilter, parentFilter, headFilter, rootOnly, showArchived],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['organization', 'department', 'list', queryParams],
    queryFn: () => listDepartments(queryParams),
  });

  const { data: stats } = useQuery({
    queryKey: ['organization', 'department', 'stats'],
    queryFn: fetchDepartmentStats,
  });

  const createMutation = useCreateEntity('department');
  const updateMutation = useUpdateEntity('department');
  const deleteMutation = useDeleteEntity('department');
  const restoreMutation = useRestoreEntity('department');

  useEffect(() => {
    if (searchParams.get('action') === 'create' && editorMode === null) {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, editorMode, setSearchParams]);

  function openCreate() {
    setFormValue({ name: '', status: 'active' });
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: DepartmentRecord) {
    setEditingRecord(record);
    setFormValue(recordToDepartmentForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    setFormError(null);
    const payload = departmentFormToPayload(formValue);
    try {
      if (editorMode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (editorMode === 'edit' && editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, payload });
      }
      setEditorMode(null);
      setEditingRecord(null);
      await refetch();
    } catch (mutationError) {
      const apiError = mutationError as ApiErrorResponse;
      setFormError(apiError.error?.message ?? 'Failed to save department');
    }
  }

  async function handleExport() {
    const blob = await exportEntities('department');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'department-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: DepartmentRecord) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Department',
      render: (row: DepartmentRecord) => (
        <Link to={ROUTES.organizationEntityDetail('department', row.id)} className="font-medium text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'branchName',
      header: 'Branch',
      render: (row: DepartmentRecord) => row.branchName ?? '—',
    },
    {
      key: 'headEmployeeName',
      header: 'Department Head',
      render: (row: DepartmentRecord) => row.headEmployeeName ?? '—',
    },
    {
      key: 'employeeCount',
      header: 'Employees',
      render: (row: DepartmentRecord) => row.employeeCount ?? 0,
    },
    {
      key: 'parentDepartmentName',
      header: 'Parent Department',
      render: (row: DepartmentRecord) => row.parentDepartmentName ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: DepartmentRecord) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: DepartmentRecord) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.organizationEntityDetail('department', row.id))}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {showArchived ? (
            <Button variant="ghost" size="sm" onClick={() => void restoreMutation.mutateAsync(row.id).then(() => refetch())}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const listError = isError ? ((error as unknown as ApiErrorResponse)?.error?.message ?? 'Failed to load departments') : null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-6 w-6 text-primary" />}
        title="Departments"
        description="Manage organizational departments, hierarchy, and leadership assignments."
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Departments' },
        ]}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Employees" value={stats?.employees ?? '—'} />
        <StatCard label="Managers" value={stats?.managers ?? '—'} />
        <StatCard label="Projects" value={stats?.projects ?? '—'} />
        <StatCard label="Open Positions" value={stats?.openPositions ?? '—'} />
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search departments, branch, or head…"
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setBranchFilter('');
          setParentFilter('');
          setHeadFilter('');
          setRootOnly(false);
          setPage(1);
        }}
        onExport={() => void handleExport()}
        exportLabel="Export CSV"
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        extras={
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={rootOnly} onChange={(event) => setRootOnly(event.target.checked)} />
            Root only
          </label>
        }
      >
        <FilterField label="Branch">
          <MasterDataSelect
            entityKey="branch"
            value={branchFilter}
            placeholder="All branches"
            onChange={(value) => {
              setBranchFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
        <FilterField label="Status">
          <StatusFilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
        <FilterField label="Parent">
          <MasterDataSelect
            entityKey="department"
            value={parentFilter === 'root' ? '' : parentFilter}
            placeholder="All parents"
            onChange={(value) => {
              setParentFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
        <FilterField label="Head">
          <EmployeeSearchSelect
            value={headFilter}
            placeholder="Any head"
            onChange={(value) => {
              setHeadFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
      </FilterBar>

      {listError ? <p className="text-sm text-destructive">{listError}</p> : null}

      <PageDataBoundary isLoading={isLoading} isError={isError} error={error} source="department-list">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyTitle="No departments yet"
          emptyMessage="Create your first department to organize teams and reporting structure."
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          }
          pagination={
            data?.pagination
              ? {
                  page: data.pagination.page,
                  totalPages: data.pagination.totalPages,
                  total: data.pagination.total,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      </PageDataBoundary>

      <Sheet
        open={editorMode !== null}
        onOpenChange={(open) => {
          if (!open) setEditorMode(null);
        }}
        title={editorMode === 'create' ? 'New Department' : 'Edit Department'}
        description="Configure department hierarchy, leadership, and contact details."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditorMode(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <DepartmentForm
          value={formValue}
          onChange={setFormValue}
          excludeDepartmentId={editingRecord?.id}
        />
        {formError ? <p className="mt-3 text-sm text-destructive">{formError}</p> : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive Department"
        description={`Archive "${deleteTarget?.name}"? Assigned employees or child departments will block this action.`}
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            await refetch();
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
