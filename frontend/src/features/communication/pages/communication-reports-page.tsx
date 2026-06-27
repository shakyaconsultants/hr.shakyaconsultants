import { FormEvent, useState } from 'react';
import { FileDown } from 'lucide-react';
import type { CommunicationReportType, ReportParams } from '@/features/communication/api/communication.api';
import { useCommunicationReport, useExportCommunicationReport } from '@/features/communication/hooks/use-communication';
import { DatePicker } from '@/shared/components/date-picker';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

const REPORT_TYPES: { value: CommunicationReportType; label: string }[] = [
  { value: 'reach', label: 'Reach' },
  { value: 'read_stats', label: 'Read Statistics' },
  { value: 'channel_activity', label: 'Channel Activity' },
  { value: 'user_activity', label: 'User Activity' },
  { value: 'unread_summary', label: 'Unread Summary' },
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

export function CommunicationReportsPage() {
  const defaults = defaultDateRange();
  const [params, setParams] = useState<ReportParams>({
    type: 'reach',
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  const { data: report, isLoading, refetch } = useCommunicationReport(params);
  const exportReport = useExportCommunicationReport();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void refetch();
  };

  const handleExport = async () => {
    const blob = await exportReport.mutateAsync(params);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `communication-report-${params.type}-${params.startDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary">
          <FileDown className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Communication Reports</h1>
        </div>
        <p className="text-sm text-muted-foreground">Generate communication reports and export to CSV.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Report Type">
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={params.type}
            onChange={(e) => setParams({ ...params, type: e.target.value as CommunicationReportType })}
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Start Date">
          <DatePicker value={params.startDate ?? ''} onChange={(value) => setParams({ ...params, startDate: value })} max={params.endDate || undefined} />
        </Field>

        <Field label="End Date">
          <DatePicker value={params.endDate ?? ''} onChange={(value) => setParams({ ...params, endDate: value })} min={params.startDate || undefined} />
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
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold capitalize">{String(report.type ?? params.type).replace(/_/g, ' ')} Report</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(report)
              .filter(([key]) => key !== 'type' && key !== 'rows')
              .map(([key, value]) => (
                <div key={key} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-bold">{String(value)}</p>
                </div>
              ))}
          </div>
          {Array.isArray(report.rows) && report.rows.length > 0 ? (
            <pre className="mt-4 overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(report.rows, null, 2)}
            </pre>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
