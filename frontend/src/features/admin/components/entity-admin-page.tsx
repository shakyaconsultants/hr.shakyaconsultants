import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { getEntityMeta, type MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import {
  getEntityPermissions,
  ORG_BULK_PERMISSION,
  ORG_EXPORT_PERMISSION,
} from '@/features/admin/constants/entity-permissions';
import { getEntityFields } from '@/features/admin/constants/entity-fields';
import {
  EntityForm,
  formValueToPayload,
  recordToFormValue,
  useReferenceOptions,
} from '@/features/admin/components/entity-form';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import { exportEntities } from '@/features/organization/api/organization.api';
import type { MasterDataRecord } from '@/features/organization/api/organization.api';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import type { ApiErrorResponse } from '@/shared/types/api.types';

export interface EntityAdminPageProps {
  entityKey: MasterEntityKey;
}

export function EntityAdminPage({ entityKey }: EntityAdminPageProps) {
  const meta = getEntityMeta(entityKey);
  const fields = getEntityFields(entityKey);
  const permissions = getEntityPermissions(entityKey);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<MasterDataRecord | null>(null);
  const [formValue, setFormValue] = useState<Record<string, unknown>>({ status: 'active' });
  const [deleteTarget, setDeleteTarget] = useState<MasterDataRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      status: statusFilter || undefined,
      includeDeleted: showArchived || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [page, search, statusFilter, showArchived],
  );

  const { data, isLoading, isError, error } = useMasterDataList(entityKey, queryParams);
  const createMutation = useCreateEntity(entityKey);
  const updateMutation = useUpdateEntity(entityKey);
  const deleteMutation = useDeleteEntity(entityKey);
  const restoreMutation = useRestoreEntity(entityKey);

  const needsBranch = fields.some((field) => field.refEntity === 'branch');
  const needsDepartment = fields.some((field) => field.refEntity === 'department');
  const needsDesignation = fields.some((field) => field.refEntity === 'designation');
  const needsEmploymentType = fields.some((field) => field.refEntity === 'employment-type');
  const needsSalaryGrade = fields.some((field) => field.refEntity === 'salary-grade');

  const branchQuery = useMasterDataList('branch', { page: 1, pageSize: 100, status: 'active' }, needsBranch);
  const departmentQuery = useMasterDataList('department', { page: 1, pageSize: 100, status: 'active' }, needsDepartment);
  const designationQuery = useMasterDataList('designation', { page: 1, pageSize: 100, status: 'active' }, needsDesignation);
  const employmentTypeQuery = useMasterDataList(
    'employment-type',
    { page: 1, pageSize: 100, status: 'active' },
    needsEmploymentType,
  );
  const salaryGradeQuery = useMasterDataList('salary-grade', { page: 1, pageSize: 100, status: 'active' }, needsSalaryGrade);

  const referenceOptions = useReferenceOptions(fields, {
    branch: branchQuery.data?.items,
    department: departmentQuery.data?.items,
    designation: designationQuery.data?.items,
    'employment-type': employmentTypeQuery.data?.items,
    'salary-grade': salaryGradeQuery.data?.items,
  });

  if (!meta) {
    return <p className="text-destructive">Unknown entity type.</p>;
  }

  const canCreate = hasPermission(permissions.create);
  const canUpdate = hasPermission(permissions.update);
  const canDelete = hasPermission(permissions.delete);
  const canExport = hasPermission(ORG_EXPORT_PERMISSION);
  const canBulk = hasPermission(ORG_BULK_PERMISSION);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate && editorMode === null) {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canCreate, editorMode, setSearchParams]);

  function openCreate() {
    setFormValue({ status: 'active' });
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: MasterDataRecord) {
    setEditingRecord(record);
    setFormValue(recordToFormValue(record, fields));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const payload = formValueToPayload(formValue, fields);
    try {
      if (editorMode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (editorMode === 'edit' && editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, payload });
      }
      setEditorMode(null);
      setEditingRecord(null);
    } catch (mutationError) {
      const apiError = mutationError as ApiErrorResponse;
      setFormError(apiError.error?.message ?? 'Failed to save record');
    }
  }

  async function handleExport() {
    const blob = await exportEntities(entityKey);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${entityKey}-export.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
  }

  const columns = [
    ...(canBulk
      ? [
          {
            key: 'select',
            header: '',
            render: (row: MasterDataRecord) => (
              <input
                type="checkbox"
                checked={selectedIds.has(row.id)}
                onChange={() => toggleSelect(row.id)}
                aria-label={`Select ${row.name}`}
              />
            ),
          },
        ]
      : []),
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
    ...(entityKey === 'department'
      ? [{ key: 'employeeCount', header: 'Employees', render: (row: MasterDataRecord) => row.employeeCount ?? 0 }]
      : []),
    {
      key: 'actions',
      header: '',
      render: (row: MasterDataRecord) => (
        <div className="flex gap-1">
          {entityKey === 'department' || entityKey === 'job-role' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.organizationEntityDetail(entityKey, row.id))}
            >
              View
            </Button>
          ) : null}
          {canUpdate ? (
            <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
          {showArchived && canUpdate ? (
            <Button variant="ghost" size="sm" onClick={() => void restoreMutation.mutateAsync(row.id)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : null}
          {canDelete && !showArchived ? (
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const listError = isError ? ((error as unknown as ApiErrorResponse)?.error?.message ?? 'Failed to load data') : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={meta.pluralLabel}
        description={meta.description}
        actions={
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <Button variant="outline" size="sm" onClick={() => void handleExport()}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            ) : null}
            {canCreate ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add {meta.label}
              </Button>
            ) : null}
          </div>
        }
      />

      <Link to={ROUTES.ORGANIZATION} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Organization
      </Link>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
          Show archived
        </label>
        {selectedIds.size > 0 && canBulk ? (
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => void handleBulkDelete()}>
            Delete selected ({selectedIds.size})
          </Button>
        ) : null}
      </div>

      {listError ? <p className="text-sm text-destructive">{listError}</p> : null}

      {editorMode ? (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 font-semibold">{editorMode === 'create' ? `New ${meta.label}` : `Edit ${meta.label}`}</h2>
          <EntityForm fields={fields} value={formValue} onChange={setFormValue} referenceOptions={referenceOptions} />
          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditorMode(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} />

      {data?.pagination ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Archive ${meta.label}`}
        description={`Archive "${deleteTarget?.name}"? You can restore it later from archived view.`}
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
