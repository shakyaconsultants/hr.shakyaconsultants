import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import {
  fetchDepartmentStats,
  type DepartmentRecord,
} from '@/features/organization/departments/department.api';
import { departmentQueryKeys } from '@/features/organization/departments/department-query-keys';
import {
  DepartmentForm,
  createEmptyDepartmentFormValue,
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
import { EntityStatusBadge } from '@/shared/components/entity-status-badge';
import { ROUTES } from '@/config/app.config';
import { exportEntities } from '@/features/organization/api/organization.api';
import { useQuery } from '@tanstack/react-query';
import { runDeleteMutation, runFormMutation, runActionMutation } from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { useAuthStore } from '@/shared/stores/app.store';

export function DepartmentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.authStatus === AUTH_STATUS.AUTHENTICATED);

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
  const [formValue, setFormValue] = useState<DepartmentFormValue>(createEmptyDepartmentFormValue());
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const { data, isLoading, isError, error } = useMasterDataList('department', queryParams);

  const { data: stats } = useQuery({
    queryKey: departmentQueryKeys.stats(),
    queryFn: fetchDepartmentStats,
    enabled: isAuthenticated,
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
    setFormValue(createEmptyDepartmentFormValue());
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: DepartmentRecord) {
    if (!isValidEntityId(record.id)) {
      setFormError('This department record is missing a valid id and cannot be edited.');
      return;
    }
    setEditingRecord(record);
    setFormValue(recordToDepartmentForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    if (!formValue.name.trim()) {
      setFormError('Department name is required.');
      return;
    }

    const payload = departmentFormToPayload(formValue, { isUpdate: editorMode === 'edit' });
    const name = formValue.name.trim();

    const saved = await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create' ? `Department "${name}" created successfully.` : `Department "${name}" updated successfully.`,
      mutation: async () => {
        if (editorMode === 'create') {
          return createMutation.mutateAsync(payload);
        }
        if (editorMode === 'edit' && editingRecord && isValidEntityId(editingRecord.id)) {
          return updateMutation.mutateAsync({ id: editingRecord.id, payload });
        }
        throw new Error('Cannot save: department id is missing or invalid.');
      },
      onSuccess: () => {
        setEditorMode(null);
        setEditingRecord(null);
        setFormValue(createEmptyDepartmentFormValue());
      },
    });

    if (!saved) {
      return;
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
      render: (row: DepartmentRecord) =>
        isValidEntityId(row.id) ? (
          <Link to={ROUTES.organizationEntityDetail('department', row.id)} className="font-medium text-primary hover:underline">
            {row.name}
          </Link>
        ) : (
          <span>{row.name}</span>
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
      render: (row: DepartmentRecord) => <EntityStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: DepartmentRecord) => (
        <div className="flex gap-1">
          {isValidEntityId(row.id) ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.organizationEntityDetail('department', row.id))}>
              View
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {showArchived ? (
            isValidEntityId(row.id) ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={restoreMutation.isPending}
                onClick={() =>
                  void runActionMutation({
                    successMessage: `Department "${row.name}" restored successfully.`,
                    mutation: () => restoreMutation.mutateAsync(row.id),
                  })
                }
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : null
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={!isValidEntityId(row.id)}
              onClick={() => {
                if (!isValidEntityId(row.id)) {
                  return;
                }
                setDeleteError(null);
                setDeleteTarget(row);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const listError = isError ? parseMutationError(error).message : null;

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
        <StatCard label="Active Job Roles" value={stats?.openPositions ?? '—'} />
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
            includeAllStatuses
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
          excludeDepartmentId={isValidEntityId(editingRecord?.id) ? editingRecord?.id : undefined}
        />
        {formError ? <p className="mt-3 text-sm text-destructive">{formError}</p> : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive Department"
        description={`Archive "${deleteTarget?.name}"? This is blocked when the department has child departments, assigned employees, job roles, designations, or projects.`}
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) {
            setDeleteError('Cannot archive: department id is missing or invalid.');
            return;
          }
          await runDeleteMutation({
            setError: setDeleteError,
            entityLabel: 'Department',
            successMessage: `Department "${deleteTarget.name}" archived successfully.`,
            mutation: () => deleteMutation.mutateAsync(deleteTarget.id),
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
