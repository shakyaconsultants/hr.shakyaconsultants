import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock3, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import {
  WorkShiftForm,
  defaultWorkShiftFormValue,
  recordToWorkShiftForm,
  workShiftFormToPayload,
  type WorkShiftFormValue,
} from '@/features/organization/work-shifts/work-shift-form';
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
import { formatTimeDisplay } from '@/shared/utils/datetime';
import { runActionMutation, runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';

export function WorkShiftListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<MasterDataRecord | null>(null);
  const [formValue, setFormValue] = useState<WorkShiftFormValue>(defaultWorkShiftFormValue());
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
      sortBy: 'name',
      sortOrder: 'asc' as const,
    }),
    [page, search, statusFilter, showArchived],
  );

  const { data, isLoading, isError, error } = useMasterDataList('work-shift', queryParams);
  const createMutation = useCreateEntity('work-shift');
  const updateMutation = useUpdateEntity('work-shift');
  const deleteMutation = useDeleteEntity('work-shift');
  const restoreMutation = useRestoreEntity('work-shift');

  useEffect(() => {
    if (searchParams.get('action') === 'create' && editorMode === null) {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, editorMode, setSearchParams]);

  function openCreate() {
    setFormValue(defaultWorkShiftFormValue());
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: MasterDataRecord) {
    setEditingRecord(record);
    setFormValue(recordToWorkShiftForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    const payload = workShiftFormToPayload(formValue);
    const name = formValue.name.trim();

    await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create'
          ? `Work shift "${name}" created successfully.`
          : `Work shift "${name}" updated successfully.`,
      mutation: async () => {
        if (editorMode === 'create') {
          return createMutation.mutateAsync(payload);
        }
        if (editorMode === 'edit' && editingRecord && isValidEntityId(editingRecord.id)) {
          return updateMutation.mutateAsync({ id: editingRecord.id, payload });
        }
        throw new Error('Cannot save: work shift id is missing or invalid.');
      },
      onSuccess: () => {
        setEditorMode(null);
        setEditingRecord(null);
      },
    });
  }

  async function handleExport() {
    const blob = await exportEntities('work-shift');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'work-shift-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    { key: 'name', header: 'Shift' },
    {
      key: 'startTime',
      header: 'Schedule',
      render: (row: MasterDataRecord) =>
        `${formatTimeDisplay(String(row.startTime ?? ''))} – ${formatTimeDisplay(String(row.endTime ?? ''))}`,
    },
    {
      key: 'breakMinutes',
      header: 'Break',
      render: (row: MasterDataRecord) => `${row.breakMinutes ?? 0} min`,
    },
    {
      key: 'gracePeriodMinutes',
      header: 'Grace',
      render: (row: MasterDataRecord) => `${row.gracePeriodMinutes ?? 0} min`,
    },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: '',
      render: (row: MasterDataRecord) => (
        <div className="flex gap-1">
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
                    successMessage: `Work shift "${row.name}" restored successfully.`,
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
        icon={<Clock3 className="h-6 w-6 text-primary" />}
        title="Work Shifts"
        description="Define shift schedules, grace periods, and attendance rules without manual time entry."
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Work Shifts' },
        ]}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Work Shift
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search work shifts…"
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setShowArchived(false);
          setPage(1);
        }}
        onExport={() => void handleExport()}
        exportLabel="Export CSV"
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
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

      <PageDataBoundary isLoading={isLoading} isError={isError} error={error} source="work-shift-list">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyTitle="No work shifts yet"
          emptyMessage="Create your first shift to standardize attendance schedules."
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Work Shift
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
        title={editorMode === 'create' ? 'New Work Shift' : 'Edit Work Shift'}
        description="Configure schedule, weekly offs, and attendance thresholds."
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
        <WorkShiftForm value={formValue} onChange={setFormValue} />
        {formError ? <p className="mt-3 text-sm text-destructive">{formError}</p> : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive Work Shift"
        description={`Archive "${deleteTarget?.name}"? Assigned employees may block this action.`}
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) {
            setDeleteError('Cannot archive: work shift id is missing or invalid.');
            return;
          }
          await runDeleteMutation({
            setError: setDeleteError,
            entityLabel: 'Work Shift',
            successMessage: `Work shift "${deleteTarget.name}" archived successfully.`,
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
