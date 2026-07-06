import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateEntity,
  useDeleteEntity,
  useUpdateEntity,
} from '@/features/organization/hooks/use-master-data';
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
} from '@/features/organization/holidays/holiday.constants';
import { useAllHolidays } from '@/features/organization/holidays/use-holidays';
import { HolidayModulesPanel } from '@/features/organization/holidays/holiday-modules-panel';
import { weekdayLabel } from '@/features/organization/holidays/holiday-module.constants';
import { fetchAllHolidayModules } from '@/features/organization/holidays/holiday-module.api';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/page-header';
import { DataTable } from '@/shared/components/data-table';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Sheet } from '@/shared/components/ui/sheet';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { runDeleteMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { isValidEntityId } from '@/shared/utils/entity-id.util';
import { holidayModuleTypeLabel } from '@/features/organization/holidays/holiday-module.constants';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function HolidayModulesPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('holiday.create');
  const canUpdate = hasPermission('holiday.update');
  const canDelete = hasPermission('holiday.delete');

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedModuleId = searchParams.get('module') ?? '';
  const currentYear = new Date().getFullYear();
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingRecord, setEditingRecord] = useState<HolidayRecord | null>(null);
  const [formValue, setFormValue] = useState<HolidayFormValue>(defaultHolidayFormValue());
  const [deleteTarget, setDeleteTarget] = useState<HolidayRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: modules = [] } = useQuery({
    queryKey: ['holiday-modules-page'],
    queryFn: () => fetchAllHolidayModules({ status: 'active' }),
  });

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId),
    [modules, selectedModuleId],
  );

  const { data: holidays = [], isLoading, isError, error } = useAllHolidays({});
  const createMutation = useCreateEntity('holiday');
  const updateMutation = useUpdateEntity('holiday');
  const deleteMutation = useDeleteEntity('holiday');

  const moduleHolidays = useMemo(
    () => holidays.filter((holiday) => holiday.holidayModuleId === selectedModuleId),
    [holidays, selectedModuleId],
  );

  const yearNumber = Number(yearFilter) || currentYear;

  const expandedHolidays = useMemo(
    () => expandHolidaysForYear(moduleHolidays, yearNumber),
    [moduleHolidays, yearNumber],
  );

  const stats = useMemo(() => {
    const weeklyRules = moduleHolidays.filter((holiday) => holiday.type === 'weekly').length;
    const fixedDates = moduleHolidays.filter((holiday) => holiday.type !== 'weekly').length;
    return {
      modules: String(modules.length),
      scheduledDays: String(expandedHolidays.filter((h) => h.status === 'active').length),
      weeklyRules: String(weeklyRules),
      fixedDates: String(fixedDates),
    };
  }, [expandedHolidays, moduleHolidays, modules.length]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canCreate && !selectedModuleId) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canCreate, selectedModuleId, setSearchParams]);

  function openModule(moduleId: string) {
    setSearchParams({ module: moduleId });
    setCalendarMonth(new Date(yearNumber, new Date().getMonth(), 1));
  }

  function closeModule() {
    setSearchParams({});
    setEditorMode(null);
    setEditingRecord(null);
  }

  function openCreate(date?: string) {
    if (!selectedModuleId) return;
    setFormValue(defaultHolidayFormValue(date, selectedModuleId));
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
    if (!formValue.name.trim()) {
      setFormError('Holiday name is required.');
      return;
    }
    if (!formValue.holidayModuleId && !selectedModuleId) {
      setFormError('Select a holiday module first.');
      return;
    }
    if (formValue.scheduleMode !== 'every_week' && !formValue.date) {
      setFormError('Holiday date is required.');
      return;
    }
    if (formValue.type === 'branch' && !formValue.branchId) {
      setFormError('Branch is required for branch holidays.');
      return;
    }

    const payload = holidayFormToPayload({
      ...formValue,
      holidayModuleId: selectedModuleId || formValue.holidayModuleId,
    });
    const label = formValue.name.trim();

    await runFormMutation({
      setError: setFormError,
      successMessage:
        editorMode === 'create'
          ? `Holiday "${label}" scheduled successfully.`
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

  const columns = [
    {
      key: 'schedule',
      header: 'Schedule',
      render: (row: HolidayRecord) =>
        row.type === 'weekly'
          ? `Every ${weekdayLabel(row.dayOfWeek)}`
          : row.isRecurring && row.recurrenceRule === 'yearly'
            ? row.date
              ? `Every year · ${formatHolidayDate(row.date)}`
              : 'Every year'
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
            {canDelete ? (
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

  if (selectedModuleId && selectedModule) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<CalendarDays className="h-6 w-6 text-primary" />}
          title={selectedModule.name}
          description={`${holidayModuleTypeLabel(selectedModule.moduleType)} · Schedule holidays on the calendar below. Employees inherit this module via department assignment.`}
          breadcrumbs={[
            { label: 'Organization', href: ROUTES.ORGANIZATION },
            { label: 'Holiday Modules', href: ROUTES.organizationEntity('holiday-module') },
            { label: selectedModule.name },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={closeModule}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Modules
              </Button>
              {canCreate ? (
                <Button onClick={() => openCreate()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Holiday
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={`Days in ${yearFilter}`} value={stats.scheduledDays} />
          <StatCard label="Weekly off rules" value={stats.weeklyRules} />
          <StatCard label="Fixed / festival dates" value={stats.fixedDates} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Calendar year</span>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
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
          <p className="text-xs text-muted-foreground">
            Click any date on the calendar to schedule a holiday — choose one-time, every week, or
            every year.
          </p>
        </div>

        <PageDataBoundary isLoading={isLoading} isError={isError} error={listError} isEmpty={false}>
          <HolidayMonthCalendar
            month={calendarMonth}
            holidays={expandedHolidays}
            onMonthChange={setCalendarMonth}
            onSelectHoliday={(holiday) => canUpdate && openEdit(holiday)}
            onSelectDate={(dateKey) => canCreate && openCreate(dateKey)}
          />
        </PageDataBoundary>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scheduled in this module</h3>
            {canCreate ? (
              <Button variant="outline" size="sm" onClick={() => openCreate()}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-lg border">
            <DataTable columns={columns} data={moduleHolidays} isLoading={isLoading} />
          </div>
        </section>

        <HolidayEditorSheet
          editorMode={editorMode}
          formValue={formValue}
          formError={formError}
          moduleId={selectedModuleId}
          moduleName={selectedModule.name}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setEditorMode(null);
            setEditingRecord(null);
            setFormError(null);
          }}
          onChange={setFormValue}
          onSave={() => void handleSave()}
        />

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Remove holiday from module?"
          description={
            deleteTarget
              ? `Remove "${deleteTarget.name}" from this module? Attendance and leave calendars will update for mapped departments.`
              : ''
          }
          confirmLabel="Remove"
          isLoading={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={async () => {
            if (!deleteTarget || !isValidEntityId(deleteTarget.id)) return;
            await runDeleteMutation({
              setError: setDeleteError,
              successMessage: `Holiday "${deleteTarget.name}" removed.`,
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Layers className="h-6 w-6 text-primary" />}
        title="Holiday Modules"
        description="Create modules for weekly offs, festivals, and public holidays. Open a module to schedule holidays on its calendar — no separate holiday list."
        breadcrumbs={[
          { label: 'Organization', href: ROUTES.ORGANIZATION },
          { label: 'Holiday Modules' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active modules" value={stats.modules} />
        <StatCard
          label="Weekly off modules"
          value={String(modules.filter((m) => m.moduleType === 'weekly').length)}
        />
        <StatCard
          label="Festival / national modules"
          value={String(
            modules.filter((m) => ['festival', 'national'].includes(String(m.moduleType))).length,
          )}
        />
      </div>

      <HolidayModulesPanel
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onOpenModule={openModule}
      />

      <section className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How company holidays work</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Create a <strong>module</strong> (e.g. &ldquo;Weekly Offs&rdquo;, &ldquo;India Festivals
            2026&rdquo;).
          </li>
          <li>Assign departments in the module — or leave empty for company-wide holidays.</li>
          <li>
            Open the module and <strong>click dates on the calendar</strong> to schedule holidays.
          </li>
          <li>
            For weekly offs like Saturday, choose <strong>Every week</strong> or{' '}
            <strong>One-time only</strong>.
          </li>
          <li>Employees automatically inherit holidays from modules mapped to their department.</li>
        </ol>
      </section>
    </div>
  );
}

interface HolidayEditorSheetProps {
  editorMode: 'create' | 'edit' | null;
  formValue: HolidayFormValue;
  formError: string | null;
  moduleId: string;
  moduleName: string;
  isSaving: boolean;
  onClose: () => void;
  onChange: (value: HolidayFormValue) => void;
  onSave: () => void;
}

function HolidayEditorSheet({
  editorMode,
  formValue,
  formError,
  moduleId,
  moduleName,
  isSaving,
  onClose,
  onChange,
  onSave,
}: HolidayEditorSheetProps) {
  return (
    <Sheet
      open={editorMode !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editorMode === 'create' ? 'Schedule Holiday' : 'Edit Holiday'}
      description="Holidays are always saved inside the selected module."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {formError ? <p className="mb-3 text-sm text-destructive">{formError}</p> : null}
      <HolidayForm
        value={formValue}
        onChange={onChange}
        moduleId={moduleId}
        moduleName={moduleName}
      />
    </Sheet>
  );
}
