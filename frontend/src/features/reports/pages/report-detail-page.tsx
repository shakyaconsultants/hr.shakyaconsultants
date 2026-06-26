import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';
import type { ReportFilterParams } from '@/features/reports/api/reports.api';
import { DashboardWidgetGrid } from '@/features/reports/components/dashboard-widget-grid';
import { DomainReportPanel } from '@/features/reports/components/domain-report-panel';
import { ExportActions } from '@/features/reports/components/export-actions';
import { getDefaultReportFilters, ReportFilters } from '@/features/reports/components/report-filters';
import { StatCardWidget } from '@/features/reports/components/stat-card-widget';
import { TableWidget } from '@/features/reports/components/table-widget';
import { useReportResult } from '@/features/reports/hooks/use-reports';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';

export function ReportDetailPage() {
  const { domain = '', type = '' } = useParams<{ domain: string; type: string }>();
  const [filters, setFilters] = useState<ReportFilterParams>(getDefaultReportFilters());
  const [appliedFilters, setAppliedFilters] = useState<ReportFilterParams>(filters);

  const queryParams = useMemo(() => ({ ...appliedFilters }), [appliedFilters]);
  const { data: result, isLoading, isError, refetch } = useReportResult(domain, type, queryParams);

  const handleApply = () => {
    setAppliedFilters(filters);
    void refetch();
  };

  const title = `${domain} / ${type}`.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const tableColumns =
    result?.rows && result.rows.length > 0
      ? Object.keys(result.rows[0] ?? {}).map((key) => ({
          key,
          header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        }))
      : [];

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        icon={<FileBarChart className="h-6 w-6 text-primary" />}
        title={title}
        description="Report results with filters and export options."
        actions={
          <ExportActions
            domain={domain}
            type={type}
            parameters={appliedFilters as Record<string, unknown>}
            filters={{ ...appliedFilters, domain, type, format: 'csv' }}
            disabled={!result || isLoading}
          />
        }
      />

      <ReportFilters value={filters} onChange={setFilters} onApply={handleApply} />

      {isLoading ? (
        <Loading message="Running report..." />
      ) : isError ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Unable to run report. Check parameters and try again.
        </div>
      ) : result ? (
        <div className="space-y-6">
          {result.summary ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(result.summary).map(([key, value]) => (
                <StatCardWidget
                  key={key}
                  title={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={value}
                />
              ))}
            </div>
          ) : null}

          {result.widgets && result.widgets.length > 0 ? (
            <DashboardWidgetGrid widgets={result.widgets} />
          ) : null}

          {result.rows && result.rows.length > 0 ? (
            <section className="rounded-lg border bg-card p-4">
              <TableWidget title="Report Data" columns={tableColumns} rows={result.rows} />
            </section>
          ) : null}

          <DomainReportPanel domain={domain} />
        </div>
      ) : null}
    </div>
  );
}
