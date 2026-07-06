import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import { DataTable } from '@/shared/components/data-table';
import { Sheet } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { FormSection } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { useAuthStore } from '@/shared/stores/app.store';
import { runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import type { MasterDataRecord } from '@/features/organization/api/organization.api';

interface LeaveTypeRecord extends MasterDataRecord {
  isPaid?: boolean;
  maxDaysPerYear?: number;
  carryForward?: boolean;
  color?: string;
}

interface LeaveTypeFormValue {
  name: string;
  isPaid: boolean;
  maxDaysPerYear: string;
  carryForward: boolean;
  color: string;
  status: string;
}

function defaultForm(): LeaveTypeFormValue {
  return {
    name: '',
    isPaid: true,
    maxDaysPerYear: '12',
    carryForward: false,
    color: '#3B82F6',
    status: 'active',
  };
}

function recordToForm(record: LeaveTypeRecord | null): LeaveTypeFormValue {
  if (!record) return defaultForm();
  return {
    name: String(record.name ?? ''),
    isPaid: Boolean(record.isPaid ?? true),
    maxDaysPerYear: record.maxDaysPerYear !== undefined ? String(record.maxDaysPerYear) : '',
    carryForward: Boolean(record.carryForward),
    color: String(record.color ?? '#3B82F6'),
    status: String(record.status ?? 'active'),
  };
}

export function LeaveTypesPanel() {
  const canCreate = useAuthStore((s) => s.hasPermission('leave-type.create'));
  const canUpdate = useAuthStore((s) => s.hasPermission('leave-type.update'));
  const canDelete = useAuthStore((s) => s.hasPermission('leave-type.delete'));

  const { data, isLoading } = useMasterDataList('leave-type', { pageSize: 100, status: 'active' });
  const createMutation = useCreateEntity('leave-type');
  const updateMutation = useUpdateEntity('leave-type');
  const deleteMutation = useDeleteEntity('leave-type');

  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<LeaveTypeRecord | null>(null);
  const [formValue, setFormValue] = useState<LeaveTypeFormValue>(defaultForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveTypeRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const items = useMemo(() => (data?.items ?? []) as LeaveTypeRecord[], [data?.items]);

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Leave Type' },
    {
      key: 'isPaid',
      header: 'Paid',
      render: (row: LeaveTypeRecord) => (row.isPaid ? 'Yes' : 'No'),
    },
    {
      key: 'maxDaysPerYear',
      header: 'Max Days/Year',
      render: (row: LeaveTypeRecord) => row.maxDaysPerYear ?? '—',
    },
    {
      key: 'carryForward',
      header: 'Carry Forward',
      render: (row: LeaveTypeRecord) => (row.carryForward ? 'Yes' : 'No'),
    },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: '',
      render: (row: LeaveTypeRecord) =>
        canUpdate || canDelete ? (
          <div className="flex gap-1">
            {canUpdate ? (
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        ) : null,
    },
  ];

  function openCreate() {
    setFormValue(defaultForm());
    setEditing(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: LeaveTypeRecord) {
    setEditing(record);
    setFormValue(recordToForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    if (!formValue.name.trim()) {
      setFormError('Leave type name is required.');
      return;
    }

    const payload: Record<string, unknown> = {
      name: formValue.name.trim(),
      isPaid: formValue.isPaid,
      carryForward: formValue.carryForward,
      color: formValue.color,
      status: formValue.status,
      maxDaysPerYear: formValue.maxDaysPerYear ? Number(formValue.maxDaysPerYear) : undefined,
    };

    await runFormMutation({
      setError: setFormError,
      successMessage: editorMode === 'create' ? 'Leave type created.' : 'Leave type updated.',
      mutation: async () => {
        if (editorMode === 'create') return createMutation.mutateAsync(payload);
        if (editorMode === 'edit' && editing && isValidEntityId(editing.id)) {
          return updateMutation.mutateAsync({ id: editing.id, payload });
        }
        throw new Error('Cannot save leave type.');
      },
      onSuccess: () => setEditorMode(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Leave Types</h3>
          <p className="text-sm text-muted-foreground">
            Master categories (Casual, Sick, Earned, etc.). Policies apply rules and quotas on top
            of these types.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Leave Type
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DataTable columns={columns} data={items} isLoading={isLoading} />
      </div>

      <Sheet
        open={editorMode !== null}
        onOpenChange={(open) => !open && setEditorMode(null)}
        title={editorMode === 'create' ? 'Add Leave Type' : 'Edit Leave Type'}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorMode(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()}>Save</Button>
          </>
        }
      >
        {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
        <FormSection title="Type Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Name" htmlFor="lt-name" required>
              <Input
                id="lt-name"
                value={formValue.name}
                onChange={(e) => setFormValue({ ...formValue, name: e.target.value })}
              />
            </SelectField>
            <SelectField label="Max Days / Year" htmlFor="lt-max">
              <Input
                id="lt-max"
                type="number"
                min={0}
                value={formValue.maxDaysPerYear}
                onChange={(e) => setFormValue({ ...formValue, maxDaysPerYear: e.target.value })}
              />
            </SelectField>
            <SelectField label="Color" htmlFor="lt-color">
              <Input
                id="lt-color"
                value={formValue.color}
                onChange={(e) => setFormValue({ ...formValue, color: e.target.value })}
              />
            </SelectField>
            <SelectField label="Status" htmlFor="lt-status">
              <select
                id="lt-status"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={formValue.status}
                onChange={(e) => setFormValue({ ...formValue, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </SelectField>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={formValue.isPaid}
                onChange={(e) => setFormValue({ ...formValue, isPaid: e.target.checked })}
              />
              Paid leave
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={formValue.carryForward}
                onChange={(e) => setFormValue({ ...formValue, carryForward: e.target.checked })}
              />
              Allow carry forward to next year
            </label>
          </div>
        </FormSection>
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete leave type?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}"? Ensure no active policies depend on it.`
            : ''
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) return;
          await runDeleteMutation({
            setError: setDeleteError,
            successMessage: 'Leave type deleted.',
            mutation: () => deleteMutation.mutateAsync(deleteTarget.id),
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
