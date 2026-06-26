import { FormEvent, useState, type ReactNode } from 'react';
import { FileDown } from 'lucide-react';
import type { ReportParams } from '@/features/sales/api/sales.api';
import { useExportSalesReport, useSalesReport } from '@/features/sales/hooks/use-sales';
import { Loading } from '@/shared/components/loading';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';

const REPORT_TYPES: ReportParams['type'][] = [
  'source',
  'executive',
  'pipeline',
  'conversion',
  'revenue',
  'activity',
  'follow_up',
];

function defaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0] ?? '',
    endDate: end.toISOString().split('T')[0] ?? '',
  };
}

function formatReportType(type: string): string {
  return type.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function SalesReportsPage() {
  const defaults = defaultDateRange();
  const [params, setParams] = useState<ReportParams>({
    type: 'source',
    period: 'monthly',
    scope: 'company',
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  const { data: report, isLoading, refetch } = useSalesReport(params);
  const exportReport = useExportSalesReport();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void refetch();
  };

  const handleExport = async () => {
    const blob = await exportReport.mutateAsync(params);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-${params.type}-report-${params.startDate}-${params.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns =
    report && report.rows.length > 0
      ? Object.keys(report.rows[0] ?? {}).map((key) => ({
          key,
          header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          render: (row: Record<string, string | number | undefined>) => {
            const value = row[key];
            return typeof value === 'number' ? value.toLocaleString() : (value ?? '—');
          },
        }))
      : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <FileDown className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Sales Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground">Generate sales reports by type and export to CSV.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Report Type">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={params.type}
            onChange={(e) => setParams({ ...params, type: e.target.value as ReportParams['type'] })}
          >
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatReportType(type)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Period">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={params.period}
            onChange={(e) => setParams({ ...params, period: e.target.value as ReportParams['period'] })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>

        <Field label="Scope">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={params.scope}
            onChange={(e) => setParams({ ...params, scope: e.target.value as ReportParams['scope'] })}
          >
            <option value="company">Company</option>
            <option value="team">Team</option>
            <option value="executive">Executive</option>
            <option value="source">Source</option>
            <option value="pipeline">Pipeline</option>
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
                <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">{formatReportType(report.type)} Report</h2>
            <DataTable
              columns={columns}
              data={report.rows.map((row, index) => ({ ...row, id: String(index) }))}
              emptyMessage="No data for selected criteria"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
