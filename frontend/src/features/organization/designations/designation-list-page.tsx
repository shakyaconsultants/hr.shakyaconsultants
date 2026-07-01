import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import { type DesignationRecord } from '@/features/organization/designations/designation.api';
import {
  DesignationForm,
  designationFormToPayload,
  recordToDesignationForm,
  type DesignationFormValue,
} from '@/features/organization/designations/designation-form';
import { DESIGNATION_HIERARCHY_LEVELS, getHierarchyLevelLabel } from '@/features/organization/designations/designation.constants';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { FilterBar, FilterField } from '@/shared/components/filter-bar';
import { StatusFilterSelect } from '@/shared/components/status-filter-select';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Sheet } from '@/shared/components/ui/sheet';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { exportEntities } from '@/features/organization/api/organization.api';
import { runActionMutation, runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { EntityStatusBadge } from '@/shared/components/entity-status-badge';

export function DesignationListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [salaryGradeFilter, setSalaryGradeFilter] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState<number | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<DesignationRecord | null>(null);
  const [formValue, setFormValue] = useState<DesignationFormValue>({
    name: '',
    status: 'active',
    departmentIds: [],
  });
  const [deleteTarget, setDeleteTarget] = useState<DesignationRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      status: statusFilter || undefined,
      departmentId: departmentFilter || undefined,
      salaryGradeId: salaryGradeFilter || undefined,
      hierarchyLevel: hierarchyFilter,
      includeDeleted: showArchived || undefined,
      sortBy: 'hierarchyLevel',
      sortOrder: 'asc' as const,
    }),
    [page, search, statusFilter, departmentFilter, salaryGradeFilter, hierarchyFilter, showArchived],
  );

  const { data, isLoading, isError, error } = useMasterDataList('designation', queryParams);

  const createMutation = useCreateEntity('designation');
  const updateMutation = useUpdateEntity('designation');
  const deleteMutation = useDeleteEntity('designation');
  const restoreMutation = useRestoreEntity('designation');

  function openCreate() {
    setFormValue({ name: '', status: 'active', departmentIds: [] });
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: DesignationRecord) {
    setEditingRecord(record);
    setFormValue(recordToDesignationForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    const payload = designationFormToPayload(formValue);
    const name = formValue.name.trim();

    await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create'
          ? `Designation "${name}" created successfully.`
          : `Designation "${name}" updated successfully.`,
      mutation: async () => {
        if (editorMode === 'create') {
          return createMutation.mutateAsync(payload);
        }
        if (editorMode === 'edit' && editingRecord && isValidEntityId(editingRecord.id)) {
          return updateMutation.mutateAsync({ id: editingRecord.id, payload });
        }
        throw new Error('Cannot save: designation id is missing or invalid.');
      },
      onSuccess: () => {
        setEditorMode(null);
        setEditingRecord(null);
      },
    });
  }

  async function handleExport() {
    const blob = await exportEntities('designation');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'designation-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      key: 'name',
      header: 'Designation',
      render: (row: DesignationRecord) => (
        <Link
          to={ROUTES.organizationEntityDetail('designation', row.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (row: DesignationRecord) => row.departmentName ?? '—',
    },

    {
      key: 'hierarchyLevel',
      header: 'Hierarchy Level',
      render: (row: DesignationRecord) =>
        row.hierarchyLevelLabel ?? getHierarchyLevelLabel(row.hierarchyLevel),
    },
    {
      key: 'salaryGradeName',
      header: 'Salary Grade',
      render: (row: DesignationRecord) => row.salaryGradeName ?? '—',
    },
    {
      key: 'employeeCount',
      header: 'Employees Assigned',
      render: (row: DesignationRecord) => row.employeeCount ?? 0,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: DesignationRecord) => <EntityStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: DesignationRecord) => (
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
                    successMessage: `Designation "${row.name}" restored successfully.`,
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

  const hierarchyFilterOptions = useMemo(
    () => [
      { value: '', label: 'All hierarchy levels' },
      ...DESIGNATION_HIERARCHY_LEVELS.map((level) => ({
        value: String(level.value),
        label: getHierarchyLevelLabel(level.value),
      })),
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Award className="h-6 w-6 text-primary" />}
        title="Designations"
        description="Manage job titles, hierarchy levels, and promotion paths without duplicating master data."
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Designations' },
        ]}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Designation
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search designations…"
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setDepartmentFilter('');
          setSalaryGradeFilter('');
          setHierarchyFilter(undefined);
          setPage(1);
        }}
        onExport={() => void handleExport()}
        exportLabel="Export CSV"
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      >
        <FilterField label="Department">
          <MasterDataSelect
            entityKey="department"
            value={departmentFilter}
            placeholder="All departments"
            onChange={(value) => {
              setDepartmentFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
        <FilterField label="Salary Grade">
          <MasterDataSelect
            entityKey="salary-grade"
            value={salaryGradeFilter}
            placeholder="All grades"
            onChange={(value) => {
              setSalaryGradeFilter(value);
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
        <FilterField label="Hierarchy">
          <AsyncSearchSelect
            value={hierarchyFilter !== undefined ? String(hierarchyFilter) : ''}
            options={hierarchyFilterOptions}
            placeholder="All hierarchy levels"
            onChange={(value) => {
              setHierarchyFilter(value ? Number(value) : undefined);
              setPage(1);
            }}
            clearable={false}
          />
        </FilterField>
      </FilterBar>

      {listError ? <p className="text-sm text-destructive">{listError}</p> : null}

      <PageDataBoundary isLoading={isLoading} isError={isError} error={error} source="designation-list">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          emptyTitle="No designations yet"
          emptyMessage="Create your first designation to define hierarchy and job role mappings."
          emptyAction={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Designation
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
        title={editorMode === 'create' ? 'New Designation' : 'Edit Designation'}
        description="Codes are auto-generated. Full titles are composed from designation and job role at display time."
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
        <DesignationForm
          value={formValue}
          onChange={setFormValue}
          excludeDesignationId={editingRecord?.id}
        />
        {formError ? <p className="mt-3 text-sm text-destructive">{formError}</p> : null}
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Archive Designation"
        description={`Archive "${deleteTarget?.name}"? This is blocked while employees are assigned.`}
        confirmLabel="Archive"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) {
            setDeleteError('Cannot archive: designation id is missing or invalid.');
            return;
          }
          await runDeleteMutation({
            setError: setDeleteError,
            entityLabel: 'Designation',
            successMessage: `Designation "${deleteTarget.name}" archived successfully.`,
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
