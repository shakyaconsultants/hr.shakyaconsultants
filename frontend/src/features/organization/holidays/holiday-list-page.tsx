import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Layers, List, MapPin, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useMasterDataList,
  useRestoreEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
import { exportEntities } from '@/features/organization/api/organization.api';
import type { HolidayRecord } from '@/features/organization/holidays/holiday.api';
import { expandHolidaysForYear } from '@/features/organization/holidays/holiday-expand.util';
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
import { HolidayModulesPanel } from '@/features/organization/holidays/holiday-modules-panel';
import { HolidayDepartmentMappingPanel } from '@/features/organization/holidays/holiday-department-mapping-panel';
import { weekdayLabel } from '@/features/organization/holidays/holiday-module.constants';
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
import {
  runActionMutation,
  runDeleteMutation,
  runFormMutation,
} from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { cn } from '@/shared/utils/cn';

type HubTab = 'modules' | 'holidays' | 'mapping' | 'calendar';

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
  const [hubTab, setHubTab] = useState<HubTab>('modules');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
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
  const { data: modules } = useMasterDataList('holiday-module', {
    pageSize: 100,
    status: 'active',
  });
  const createMutation = useCreateEntity('holiday');
  const updateMutation = useUpdateEntity('holiday');
  const deleteMutation = useDeleteEntity('holiday');
  const restoreMutation = useRestoreEntity('holiday');

  const branchMap = useMemo(
    () => new Map((branches?.items ?? []).map((branch) => [branch.id, branch.name])),
    [branches?.items],
  );
  const moduleMap = useMemo(
    () => new Map((modules?.items ?? []).map((module) => [module.id, module.name])),
    [modules?.items],
  );

  const yearNumber = Number(yearFilter) || currentYear;

  const expandedHolidays = useMemo(
    () => expandHolidaysForYear(holidays, yearNumber),
    [holidays, yearNumber],
  );

  const filteredHolidays = useMemo(() => {
    return expandedHolidays.filter((holiday) => {
      if (typeFilter && holiday.type !== typeFilter) return false;
      if (moduleFilter && holiday.holidayModuleId !== moduleFilter) return false;
      return true;
    });
  }, [expandedHolidays, typeFilter, moduleFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const active = filteredHolidays.filter((holiday) => holiday.status === 'active');
    const upcoming = active.filter((holiday) => {
      if (!holiday.date) return false;
      const date = new Date(holiday.date);
      return date >= today && date <= in30Days;
    });

    return {
      modules: String((modules?.items ?? []).length),
      total: String(active.length),
      upcoming: String(upcoming.length),
      weekly: String(holidays.filter((h) => h.type === 'weekly').length),
    };
  }, [filteredHolidays, holidays, modules?.items]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate && editorMode === null) {
      setHubTab('holidays');
      openCreate();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canCreate, editorMode, setSearchParams]);

  function openCreate(date?: string, moduleId?: string) {
    setFormValue(defaultHolidayFormValue(date, moduleId ?? moduleFilter));
    setEditingRecord(null);
    setEditorMode('create');
    setFormError(null);
    setHubTab('holidays');
  }

  function openEdit(record: HolidayRecord) {
    setEditingRecord(record);
    setFormValue(recordToHolidayForm(record));
    setEditorMode('edit');
    setFormError(null);
    setHubTab('holidays');
  }

  async function handleSave() {
    if (createMutation.isPending || updateMutation.isPending) return;
    if (!formValue.name.trim()) {
      setFormError('Holiday name is required.');
      return;
    }
    if (formValue.type !== 'weekly' && !formValue.date) {
      setFormError('Holiday date is required.');
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
      header: 'Date / Day',
      render: (row: HolidayRecord) =>
        row.type === 'weekly'
          ? weekdayLabel(row.dayOfWeek)
          : row.date
            ? formatHolidayDate(row.date)
            : '—',
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
      key: 'holidayModuleId',
      header: 'Module',
      render: (row: HolidayRecord) =>
        row.holidayModuleId ? (moduleMap.get(row.holidayModuleId) ?? '—') : 'Unassigned',
    },
    {
      key: 'branchId',
      header: 'Branch',
      render: (row: HolidayRecord) => (row.branchId ? (branchMap.get(row.branchId) ?? '—') : 'All'),
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

  const hubTabs: Array<{ id: HubTab; label: string; icon: typeof Layers }> = [
    { id: 'modules', label: 'Holiday Modules', icon: Layers },
    { id: 'holidays', label: 'Holidays', icon: List },
    { id: 'mapping', label: 'Department Mapping', icon: MapPin },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarDays className="h-6 w-6 text-primary" />}
        title="Holiday Management"
        description="Create holiday modules (national, festival, weekly offs), map them to departments, and power attendance & leave calendars."
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Holiday Calendar' },
        ]}
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setHubTab('modules')}>
                <Layers className="mr-2 h-4 w-4" />
                New Module
              </Button>
              <Button onClick={() => openCreate()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </div>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Modules" value={stats.modules} />
        <StatCard label={`Holiday days in ${yearFilter}`} value={stats.total} />
        <StatCard label="Upcoming (30 days)" value={stats.upcoming} />
        <StatCard label="Weekly off rules" value={stats.weekly} />
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {hubTabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={hubTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setHubTab(tab.id)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {hubTab === 'modules' ? (
        <HolidayModulesPanel
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onSelectModule={(moduleId) => {
            setModuleFilter(moduleId);
            setHubTab('holidays');
          }}
        />
      ) : null}

      {hubTab === 'mapping' ? <HolidayDepartmentMappingPanel /> : null}

      {hubTab === 'holidays' || hubTab === 'calendar' ? (
        <>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search holidays…"
            onReset={() => {
              setSearch('');
              setStatusFilter('');
              setTypeFilter('');
              setModuleFilter('');
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
                  setCalendarMonth(
                    new Date(Number(event.target.value), calendarMonth.getMonth(), 1),
                  );
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Module">
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
              >
                <option value="">All modules</option>
                {(modules?.items ?? []).map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
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

          {hubTab === 'calendar' ? (
            <PageDataBoundary
              isLoading={isLoading}
              isError={isError}
              error={listError}
              isEmpty={!isLoading && filteredHolidays.length === 0}
              emptyTitle="No holidays for this year"
              emptyDescription="Create a module, assign departments, then add holidays."
            >
              <HolidayMonthCalendar
                month={calendarMonth}
                holidays={filteredHolidays}
                onMonthChange={setCalendarMonth}
                onSelectHoliday={(holiday) => canUpdate && openEdit(holiday)}
                onSelectDate={(dateKey) => canCreate && openCreate(dateKey, moduleFilter)}
              />
            </PageDataBoundary>
          ) : (
            <PageDataBoundary
              isLoading={isLoading}
              isError={isError}
              error={listError}
              isEmpty={!isLoading && filteredHolidays.length === 0}
              emptyTitle="No holidays for this year"
              emptyDescription="Add holidays to modules — employees inherit them via department mapping."
              emptyAction={
                canCreate ? (
                  <Button onClick={() => openCreate(undefined, moduleFilter)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                  </Button>
                ) : undefined
              }
            >
              <div className="overflow-hidden rounded-lg border">
                <DataTable columns={columns} data={filteredHolidays} />
              </div>
            </PageDataBoundary>
          )}
        </>
      ) : null}

      <section className={cn('rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground')}>
        <p className="font-medium text-foreground">How the holiday system works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Create a <strong>Holiday Module</strong> (national, festival pack, or weekly offs).
          </li>
          <li>
            Assign the module to one or more <strong>departments</strong> (or leave empty for
            company-wide).
          </li>
          <li>
            Add individual holidays into the module — fixed dates, festivals, or weekly off days.
          </li>
          <li>Employees automatically inherit holidays from modules mapped to their department.</li>
        </ol>
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
        description="Assign to a module so the right departments receive this holiday."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorMode(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Holiday'}
            </Button>
          </>
        }
      >
        {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
        <HolidayForm value={formValue} onChange={setFormValue} moduleFilterId={moduleFilter} />
      </Sheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete holiday?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}"? This affects attendance and calendars for mapped departments.`
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
