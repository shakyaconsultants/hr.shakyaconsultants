import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, List, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import { exportEntities } from '@/features/organization/api/organization.api';
import type { HolidayRecord } from '@/features/organization/holidays/holiday.api';
import {
  defaultHolidayFormValue,
  HolidayForm,
  holidayFormToPayload,
  recordToHolidayForm,
  type HolidayFormValue,
} from '@/features/organization/holidays/holiday-form';
import { HolidayMonthCalendar } from '@/features/organization/holidays/holiday-month-calendar';
import {
  formatHolidayDate,
  holidayTypeLabel,
  HOLIDAY_TYPES,
} from '@/features/organization/holidays/holiday.constants';
import { useAllHolidays } from '@/features/organization/holidays/use-holidays';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Sheet } from '@/shared/components/ui/sheet';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { FilterBar, FilterField } from '@/shared/components/filter-bar';
import { StatusFilterSelect } from '@/shared/components/status-filter-select';
import { Button } from '@/shared/components/ui/button';
import { ORG_EXPORT_PERMISSION } from '@/features/admin/constants/entity-permissions';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { runActionMutation, runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { cn } from '@/shared/utils/cn';

type ViewMode = 'calendar' | 'list';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function HolidayListPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('holiday.create');
  const canUpdate = hasPermission('holiday.update');
  const canDelete = hasPermission('holiday.delete');
  const canExport = hasPermission(ORG_EXPORT_PERMISSION);

  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<HolidayRecord | null>(null);
  const [formValue, setFormValue] = useState<HolidayFormValue>(defaultHolidayFormValue());
  const [deleteTarget, setDeleteTarget] = useState<HolidayRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      includeDeleted: showArchived || undefined,
      branchId: branchFilter || undefined,
    }),
    [search, statusFilter, showArchived, branchFilter],
  );

  const { data: holidays = [], isLoading, isError, error } = useAllHolidays(listParams);
  const { data: branches } = useMasterDataList('branch', { pageSize: 100, status: 'active' });
  const createMutation = useCreateEntity('holiday');
  const updateMutation = useUpdateEntity('holiday');
  const deleteMutation = useDeleteEntity('holiday');
  const restoreMutation = useRestoreEntity('holiday');

  const branchMap = useMemo(
    () => new Map((branches?.items ?? []).map((branch) => [branch.id, branch.name])),
    [branches?.items],
  );

  const yearNumber = Number(yearFilter) || currentYear;

  const filteredHolidays = useMemo(() => {
    return holidays.filter((holiday) => {
      const holidayYear = new Date(holiday.date).getFullYear();
      if (holidayYear !== yearNumber) return false;
      if (typeFilter && holiday.type !== typeFilter) return false;
      return true;
    });
  }, [holidays, yearNumber, typeFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const active = filteredHolidays.filter((holiday) => holiday.status === 'active');
    const upcoming = active.filter((holiday) => {
      const date = new Date(holiday.date);
      return date >= today && date <= in30Days;
    });

    return {
      total: String(active.length),
      upcoming: String(upcoming.length),
      public: String(active.filter((holiday) => holiday.type === 'public').length),
      optional: String(active.filter((holiday) => holiday.isOptional || holiday.type === 'optional').length),
    };
  }, [filteredHolidays]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate && editorMode === null) {
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canCreate, editorMode, setSearchParams]);

  function openCreate(date?: string) {
    setFormValue(defaultHolidayFormValue(date));
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
  }

  function openEdit(record: HolidayRecord) {
    setEditingRecord(record);
    setFormValue(recordToHolidayForm(record));
    setEditorMode('edit');
    setFormError(null);
  }

  async function handleSave() {
    if (createMutation.isPending || updateMutation.isPending) return;
    if (!formValue.name.trim() || !formValue.date) {
      setFormError('Holiday name and date are required.');
      return;
    }
    if (formValue.type === 'branch' && !formValue.branchId) {
      setFormError('Branch is required for branch holidays.');
      return;
    }

    const payload = holidayFormToPayload(formValue);
    const label = formValue.name.trim();

    await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create'
          ? `Holiday "${label}" created successfully.`
          : `Holiday "${label}" updated successfully.`,
      mutation: async () => {
        if (editorMode === 'create') {
          return createMutation.mutateAsync(payload);
        }
        if (editorMode === 'edit' && editingRecord && isValidEntityId(editingRecord.id)) {
          return updateMutation.mutateAsync({ id: editingRecord.id, payload });
        }
        throw new Error('Cannot save: holiday id is missing or invalid.');
      },
      onSuccess: () => {
        setEditorMode(null);
        setEditingRecord(null);
      },
    });
  }

  async function handleExport() {
    const blob = await exportEntities('holiday');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `holidays-${yearFilter}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: HolidayRecord) => formatHolidayDate(row.date),
    },
    { key: 'name', header: 'Holiday' },
    {
      key: 'type',
      header: 'Type',
      render: (row: HolidayRecord) => (
        <span className="capitalize">{holidayTypeLabel(row.type)}</span>
      ),
    },
    {
      key: 'branchId',
      header: 'Branch',
      render: (row: HolidayRecord) => (row.branchId ? branchMap.get(row.branchId) ?? '—' : 'All'),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row: HolidayRecord) => (
        <div className="flex flex-wrap gap-1 text-xs">
          {row.isRecurring ? <span className="rounded bg-muted px-2 py-0.5">Recurring</span> : null}
          {row.isOptional ? <span className="rounded bg-muted px-2 py-0.5">Optional</span> : null}
        </div>
      ),
    },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: '',
      render: (row: HolidayRecord) =>
        canUpdate || canDelete ? (
          <div className="flex gap-1">
            {canUpdate ? (
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {showArchived ? (
              isValidEntityId(row.id) && canUpdate ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={restoreMutation.isPending}
                  onClick={() =>
                    void runActionMutation({
                      successMessage: `Holiday "${row.name}" restored successfully.`,
                      mutation: () => restoreMutation.mutateAsync(row.id),
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : null
            ) : canDelete ? (
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
        ) : null,
    },
  ];

  const listError = isError ? parseMutationError(error).message : null;
  const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarDays className="h-6 w-6 text-primary" />}
        title="Holiday Calendar"
        description="Plan company-wide, branch, and optional holidays. Used by attendance, leave, and employee calendars."
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Holidays' },
        ]}
        actions={
          canCreate ? (
            <Button onClick={() => openCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Holidays in ${yearFilter}`} value={stats.total} />
        <StatCard label="Upcoming (30 days)" value={stats.upcoming} />
        <StatCard label="Public holidays" value={stats.public} />
        <StatCard label="Optional / restricted" value={stats.optional} />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search holidays…"
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setTypeFilter('');
          setBranchFilter('');
          setShowArchived(false);
          setYearFilter(String(currentYear));
        }}
        onExport={canExport ? () => void handleExport() : undefined}
        exportLabel="Export CSV"
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      >
        <FilterField label="Year">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={yearFilter}
            onChange={(event) => {
              setYearFilter(event.target.value);
              setCalendarMonth(new Date(Number(event.target.value), calendarMonth.getMonth(), 1));
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Type">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">All types</option>
            {HOLIDAY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Branch">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="">All branches</option>
            {(branches?.items ?? []).map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} />
        </FilterField>
      </FilterBar>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewMode('calendar')}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
      </div>

      <PageDataBoundary
        isLoading={isLoading}
        isError={isError}
        error={listError}
        isEmpty={!isLoading && filteredHolidays.length === 0}
        emptyTitle="No holidays for this year"
        emptyDescription="Add holidays to power attendance, leave planning, and company calendars."
        emptyAction={
          canCreate ? (
            <Button onClick={() => openCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          ) : undefined
        }
      >
        {viewMode === 'calendar' ? (
          <HolidayMonthCalendar
            month={calendarMonth}
            holidays={filteredHolidays}
            onMonthChange={setCalendarMonth}
            onSelectHoliday={(holiday) => canUpdate && openEdit(holiday)}
            onSelectDate={(dateKey) => canCreate && openCreate(dateKey)}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <DataTable columns={columns} data={filteredHolidays} />
          </div>
        )}
      </PageDataBoundary>

      <section className={cn('rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground')}>
        <p className="font-medium text-foreground">How holidays are used</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Attendance marks these dates as non-working days automatically.</li>
          <li>Leave calendar and workspace calendar surface holidays to employees.</li>
          <li>Branch holidays apply only to the selected branch; public holidays apply company-wide.</li>
        </ul>
      </section>

      <Sheet
        open={editorMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditorMode(null);
            setEditingRecord(null);
            setFormError(null);
          }
        }}
        title={editorMode === 'create' ? 'Add Holiday' : 'Edit Holiday'}
        description="Configure date, scope, recurrence, and policy for this holiday."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorMode(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Holiday'}
            </Button>
          </>
        }
      >
        {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
        <HolidayForm value={formValue} onChange={setFormValue} />
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete holiday?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}" on ${formatHolidayDate(deleteTarget.date)}? This affects attendance and calendars.`
            : ''
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={async () => {
          if (!deleteTarget || !isValidEntityId(deleteTarget.id)) return;
          await runDeleteMutation({
            setError: setDeleteError,
            successMessage: `Holiday "${deleteTarget.name}" deleted successfully.`,
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
