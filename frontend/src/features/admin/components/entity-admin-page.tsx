import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { getEntityMeta, type MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import {
  getEntityPermissions,
  ORG_BULK_PERMISSION,
  ORG_EXPORT_PERMISSION,
} from '@/features/admin/constants/entity-permissions';
import { getEntityFormFields } from '@/features/admin/constants/entity-fields';
import {
  EntityForm,
  formValueToPayload,
  recordToFormValue,
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
import { Sheet } from '@/shared/components/ui/sheet';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { FilterBar, FilterField } from '@/shared/components/filter-bar';
import { StatusFilterSelect } from '@/shared/components/status-filter-select';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { runActionMutation, runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';

export interface EntityAdminPageProps {
  entityKey: MasterEntityKey;
}

export function EntityAdminPage({ entityKey }: EntityAdminPageProps) {
  const meta = getEntityMeta(entityKey);
  const fields = getEntityFormFields(entityKey);
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  async function handleSave() {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    const payload = formValueToPayload(formValue, fields);
    const label = meta?.label ?? 'Record';

    await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create' ? `${label} created successfully.` : `${label} updated successfully.`,
      mutation: async () => {
        if (editorMode === 'create') {
          return createMutation.mutateAsync(payload);
        }
        if (editorMode === 'edit' && editingRecord && isValidEntityId(editingRecord.id)) {
          return updateMutation.mutateAsync({ id: editingRecord.id, payload });
        }
        throw new Error('Cannot save: record id is missing or invalid.');
      },
      onSuccess: () => {
        setEditorMode(null);
        setEditingRecord(null);
      },
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await handleSave();
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
    const label = meta?.label ?? 'Record';
    for (const id of selectedIds) {
      const ok = await runDeleteMutation({
        entityLabel: label,
        successMessage: `${label} archived successfully.`,
        mutation: () => deleteMutation.mutateAsync(id),
      });
      if (!ok) {
        return;
      }
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
            <Button
              variant="ghost"
              size="sm"
              disabled={restoreMutation.isPending}
              onClick={() =>
                void runActionMutation({
                  successMessage: `${meta.label} restored successfully.`,
                  mutation: () => restoreMutation.mutateAsync(row.id),
                })
              }
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : null}
          {canDelete && !showArchived ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!isValidEntityId(row.id)}
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(row);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const listError = isError ? parseMutationError(error).message : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={meta.pluralLabel}
        description={meta.description}
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: meta.pluralLabel },
        ]}
        actions={
          canCreate ? (
            <Button size="sm" className="whitespace-nowrap" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add {meta.label}
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={`Search ${meta.pluralLabel.toLowerCase()}…`}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setShowArchived(false);
          setPage(1);
        }}
        onExport={canExport ? () => void handleExport() : undefined}
        exportLabel="Export CSV"
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        extras={
          selectedIds.size > 0 && canBulk ? (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => void handleBulkDelete()}>
              Delete selected ({selectedIds.size})
            </Button>
          ) : null
        }
      >
        <FilterField label="Status">
          <StatusFilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
      </FilterBar>

      {listError ? <p className="text-sm text-destructive">{listError}</p> : null}

      <PageDataBoundary isLoading={isLoading} isError={isError} error={error} source={`entity-${entityKey}`}>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyTitle={`No ${meta.pluralLabel.toLowerCase()} yet`}
          emptyMessage={canCreate ? `Create your first ${meta.label.toLowerCase()}.` : undefined}
          emptyAction={
            canCreate ? (
              <Button size="sm" className="whitespace-nowrap" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add {meta.label}
              </Button>
            ) : undefined
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
        title={editorMode === 'create' ? `New ${meta.label}` : `Edit ${meta.label}`}
        description={`${editorMode === 'create' ? 'Create' : 'Update'} ${meta.label.toLowerCase()} without leaving the list.`}
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
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          <EntityForm fields={fields} value={formValue} onChange={setFormValue} />
          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
        </form>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Archive ${meta.label}`}
        description={`Archive "${deleteTarget?.name}"? Dependent records may block this action.`}
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) {
            setDeleteError('Cannot archive: record id is missing or invalid.');
            return;
          }
          await runDeleteMutation({
            setError: setDeleteError,
            entityLabel: meta.label,
            successMessage: `${meta.label} archived successfully.`,
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
