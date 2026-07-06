import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, CalendarDays } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import {
  fetchAllHolidayModules,
  type HolidayModuleRecord,
} from '@/features/organization/holidays/holiday-module.api';
import {
  defaultHolidayModuleFormValue,
  HolidayModuleForm,
  holidayModuleFormToPayload,
  recordToHolidayModuleForm,
  type HolidayModuleFormValue,
} from '@/features/organization/holidays/holiday-module-form';
import { holidayModuleTypeLabel } from '@/features/organization/holidays/holiday-module.constants';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/shared/components/data-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Sheet } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { isValidEntityId } from '@/shared/utils/entity-id.util';

interface HolidayModulesPanelProps {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onOpenModule?: (moduleId: string) => void;
}

export function HolidayModulesPanel({
  canCreate,
  canUpdate,
  canDelete,
  onOpenModule,
}: HolidayModulesPanelProps) {
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<HolidayModuleRecord | null>(null);
  const [formValue, setFormValue] = useState<HolidayModuleFormValue>(
    defaultHolidayModuleFormValue(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HolidayModuleRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: modules = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['holiday-modules'],
    queryFn: () => fetchAllHolidayModules({ status: 'active' }),
  });

  const createMutation = useCreateEntity('holiday-module');
  const updateMutation = useUpdateEntity('holiday-module');
  const deleteMutation = useDeleteEntity('holiday-module');

  const departmentCounts = useMemo(() => {
    return new Map(modules.map((module) => [module.id, (module.departmentIds ?? []).length]));
  }, [modules]);

  function openCreate() {
    setFormValue(defaultHolidayModuleFormValue());
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: HolidayModuleRecord) {
    setEditingRecord(record);
    setFormValue(recordToHolidayModuleForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    if (!formValue.name.trim()) {
      setFormError('Module name is required.');
      return;
    }

    await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create'
          ? `Holiday module "${formValue.name.trim()}" created.`
          : `Holiday module "${formValue.name.trim()}" updated.`,
      mutation: async () => {
        const payload = holidayModuleFormToPayload(formValue);
        if (editorMode === 'create') {
          return createMutation.mutateAsync(payload);
        }
        if (editorMode === 'edit' && editingRecord && isValidEntityId(editingRecord.id)) {
          return updateMutation.mutateAsync({ id: editingRecord.id, payload });
        }
        throw new Error('Cannot save module.');
      },
      onSuccess: async () => {
        setEditorMode(null);
        setEditingRecord(null);
        await refetch();
      },
    });
  }

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Module' },
    {
      key: 'moduleType',
      header: 'Type',
      render: (row: HolidayModuleRecord) => holidayModuleTypeLabel(row.moduleType),
    },
    {
      key: 'calendarYear',
      header: 'Year',
      render: (row: HolidayModuleRecord) => row.calendarYear ?? 'All years',
    },
    {
      key: 'departments',
      header: 'Departments',
      render: (row: HolidayModuleRecord) => {
        const count = departmentCounts.get(row.id) ?? 0;
        return count === 0 ? 'All' : `${count} assigned`;
      },
    },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: '',
      render: (row: HolidayModuleRecord) => (
        <div className="flex gap-1">
          {onOpenModule ? (
            <Button variant="default" size="sm" onClick={() => onOpenModule(row.id)}>
              <CalendarDays className="mr-1 h-4 w-4" />
              Open calendar
            </Button>
          ) : null}
          {canUpdate ? (
            <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="ghost"
              size="sm"
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Holiday Modules</h3>
          <p className="text-sm text-muted-foreground">
            Group weekly offs, festivals, and public holidays. Open a module to schedule on its
            calendar.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Module
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DataTable columns={columns} data={modules} isLoading={isLoading} />
      </div>

      <Sheet
        open={editorMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditorMode(null);
            setEditingRecord(null);
            setFormError(null);
          }
        }}
        title={editorMode === 'create' ? 'Create Holiday Module' : 'Edit Holiday Module'}
        description="Define module type, year, and which departments receive these holidays."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorMode(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Module'}
            </Button>
          </>
        }
      >
        {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
        <HolidayModuleForm value={formValue} onChange={setFormValue} />
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete holiday module?"
        description={
          deleteTarget
            ? `Remove module "${deleteTarget.name}"? You must remove all holidays from this module first.`
            : ''
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) return;
          await runDeleteMutation({
            setError: setDeleteError,
            successMessage: `Module "${deleteTarget.name}" deleted.`,
            mutation: () => deleteMutation.mutateAsync(deleteTarget.id),
            onSuccess: async () => {
              setDeleteTarget(null);
              await refetch();
            },
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
