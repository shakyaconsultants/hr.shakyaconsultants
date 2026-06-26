import { FormEvent, useState } from 'react';
import { FileDown } from 'lucide-react';
import type { ReportParams } from '@/features/attendance/api/attendance.api';
import { useAttendanceReport, useExportAttendanceReport } from '@/features/attendance/hooks/use-attendance';
import { Loading } from '@/shared/components/loading';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';

function defaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate: end.toISOString().split('T')[0] ?? '',
  };
}

export function AttendanceReportsPage() {
  const defaults = defaultDateRange();
  const [params, setParams] = useState<ReportParams>({
    period: 'monthly',
    scope: 'company',
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  const { data: report, isLoading, refetch } = useAttendanceReport(params);
  const exportReport = useExportAttendanceReport();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void refetch();
  };

  const handleExport = async () => {
    const blob = await exportReport.mutateAsync(params);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${params.startDate}-${params.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <FileDown className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Attendance Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground">Generate attendance reports and export to CSV.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Period">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={params.period}
            onChange={(e) => setParams({ ...params, period: e.target.value as ReportParams['period'] })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </Field>

        <Field label="Scope">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={params.scope}
            onChange={(e) => setParams({ ...params, scope: e.target.value as ReportParams['scope'] })}
          >
            <option value="company">Company</option>
            <option value="department">Department</option>
            <option value="branch">Branch</option>
            <option value="employee">Employee</option>
          </select>
        </Field>

        <Field label="Start Date">
          <input
            type="date"
            className="w-full rounded-md border p-2 text-sm"
            value={params.startDate}
            onChange={(e) => setParams({ ...params, startDate: e.target.value })}
            required
          />
        </Field>

        <Field label="End Date">
          <input
            type="date"
            className="w-full rounded-md border p-2 text-sm"
            value={params.endDate}
            onChange={(e) => setParams({ ...params, endDate: e.target.value })}
            required
          />
        </Field>

        <div className="flex items-end gap-2">
          <Button type="submit">Generate</Button>
          <Button type="button" variant="outline" onClick={() => void handleExport()} disabled={exportReport.isPending}>
            {exportReport.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Loading message="Generating report..." />
      ) : report ? (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(report.summary).map(([key, value]) => (
              <div key={key} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <DataTable
            columns={[
              { key: 'employeeId', header: 'Employee ID' },
              { key: 'employeeName', header: 'Name', render: (row) => row.employeeName ?? '—' },
              { key: 'presentDays', header: 'Present' },
              { key: 'absentDays', header: 'Absent' },
              { key: 'lateDays', header: 'Late' },
              { key: 'halfDays', header: 'Half Day' },
              { key: 'leaveDays', header: 'Leave' },
              {
                key: 'workedMinutes',
                header: 'Worked (hrs)',
                render: (row) => (row.workedMinutes / 60).toFixed(1),
              },
              {
                key: 'overtimeMinutes',
                header: 'Overtime (hrs)',
                render: (row) => (row.overtimeMinutes / 60).toFixed(1),
              },
            ]}
            data={report.rows.map((row, index) => ({ ...row, id: `${row.employeeId}-${index}` }))}
            emptyMessage="No report data for selected period"
          />
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
