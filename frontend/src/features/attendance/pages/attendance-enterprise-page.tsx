import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, ExternalLink, FileText, Settings, Users } from 'lucide-react';
import { AttendanceSummaryCalendar } from '@/features/attendance/components/attendance-summary-calendar';
import { AttendanceDailyRegisterPanel } from '@/features/attendance/components/attendance-daily-register-panel';
import { AttendanceEmployeeHistoryPanel } from '@/features/attendance/components/attendance-employee-history-panel';
import { PolicySettingsForm } from '@/features/attendance/components/policy-settings-form';
import {
  useCreateShiftAssignment,
  useDeleteShiftAssignment,
  useEnterpriseAttendanceDashboard,
  useProcessMonthlyAttendance,
  useShiftAssignments,
} from '@/features/attendance/hooks/use-attendance';
import { MASTER_ENTITIES } from '@/features/organization/constants/entity-catalog';
import { DatePicker } from '@/shared/components/date-picker';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = [
  'Overview',
  'Daily Register',
  'Employee History',
  'Policies',
  'Shifts',
  'Assignments',
  'Calendar',
  'Processing',
] as const;

export function AttendanceEnterprisePage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const { data: dashboard, isLoading } = useEnterpriseAttendanceDashboard();
  const { data: assignments, isLoading: assignmentsLoading } = useShiftAssignments({
    pageSize: 50,
  });
  const createAssignment = useCreateShiftAssignment();
  const deleteAssignment = useDeleteShiftAssignment();
  const processMonthly = useProcessMonthlyAttendance();

  const [employeeId, setEmployeeId] = useState('');
  const [workShiftId, setWorkShiftId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  if (isLoading && activeTab === 'Overview') {
    return <Loading message="Loading attendance admin..." />;
  }

  const handleCreateAssignment = async () => {
    if (!employeeId || !workShiftId || !effectiveFrom) return;
    await createAssignment.mutateAsync({ employeeId, workShiftId, effectiveFrom });
    setEmployeeId('');
    setWorkShiftId('');
    setEffectiveFrom('');
  };

  const handleProcessMonth = async () => {
    const now = new Date();
    await processMonthly.mutateAsync({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Attendance Administration</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            View daily punch records, employee history, policies, and shift assignments.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'Overview' && dashboard ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Present Today" value={dashboard.presentToday} />
            <StatCard icon={Users} label="Absent Today" value={dashboard.absentToday} />
            <StatCard icon={Clock} label="Late Today" value={dashboard.lateToday} />
            <StatCard icon={CalendarDays} label="On Leave Today" value={dashboard.onLeaveToday} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={FileText}
              label="Pending Corrections"
              value={dashboard.pendingCorrections}
            />
            <StatCard icon={Clock} label="Missing Punches" value={dashboard.missingPunches} />
            {dashboard.totalEmployees != null ? (
              <StatCard icon={Users} label="Total Employees" value={dashboard.totalEmployees} />
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === 'Daily Register' ? (
        <section className="erp-card p-6">
          <h2 className="mb-1 font-semibold">Daily Attendance Register</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            All employees with punch-in and punch-out times for the selected day.
          </p>
          <AttendanceDailyRegisterPanel />
        </section>
      ) : null}

      {activeTab === 'Employee History' ? (
        <section className="erp-card p-6">
          <h2 className="mb-1 font-semibold">Employee Attendance History</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Select an employee, then browse their monthly attendance calendar with punch times.
          </p>
          <AttendanceEmployeeHistoryPanel />
        </section>
      ) : null}

      {activeTab === 'Policies' ? (
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h2 className="font-semibold">Attendance Policy Settings</h2>
          </div>
          <PolicySettingsForm />
        </section>
      ) : null}

      {activeTab === 'Shifts' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 font-semibold">Work Shifts</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Work shifts are managed in Organization master data. Create and edit shift definitions
            there.
          </p>
          <Button asChild>
            <Link to={ROUTES.organizationEntity(MASTER_ENTITIES.WORK_SHIFT)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Work Shifts
            </Link>
          </Button>
        </section>
      ) : null}

      {activeTab === 'Assignments' ? (
        <section className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Assign Shift to Employee</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-md border p-2 text-sm"
                placeholder="Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <input
                className="rounded-md border p-2 text-sm"
                placeholder="Work Shift ID"
                value={workShiftId}
                onChange={(e) => setWorkShiftId(e.target.value)}
              />
              <DatePicker value={effectiveFrom} onChange={setEffectiveFrom} required />
            </div>
            <Button
              className="mt-3"
              onClick={() => void handleCreateAssignment()}
              disabled={createAssignment.isPending}
            >
              {createAssignment.isPending ? 'Assigning...' : 'Assign Shift'}
            </Button>
          </div>

          <DataTable
            columns={[
              { key: 'employeeId', header: 'Employee' },
              { key: 'workShiftId', header: 'Shift' },
              {
                key: 'effectiveFrom',
                header: 'Effective From',
                render: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void deleteAssignment.mutateAsync(row.id)}
                    disabled={deleteAssignment.isPending}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
            data={assignments?.items ?? []}
            isLoading={assignmentsLoading}
            emptyMessage="No shift assignments configured"
          />
        </section>
      ) : null}

      {activeTab === 'Calendar' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-1 font-semibold">Attendance Overview Calendar</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Monthly view with present and absent counts per day. Use Employee History for individual
            details.
          </p>
          <AttendanceSummaryCalendar />
        </section>
      ) : null}

      {activeTab === 'Processing' ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 font-semibold">Monthly Processing</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Process attendance for the current month and mark payroll snapshots on records.
          </p>
          <Button onClick={() => void handleProcessMonth()} disabled={processMonthly.isPending}>
            {processMonthly.isPending ? 'Processing...' : 'Process Current Month'}
          </Button>
          {processMonthly.isSuccess ? (
            <p className="mt-2 text-sm text-emerald-600">
              Processed {processMonthly.data.processed} records for {processMonthly.data.month}.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
