import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { ReportDomain, ReportFilterParams } from '@/features/reports/api/reports.api';
import { ChartWidget, type ChartDataPoint } from '@/features/reports/components/chart-widget';
import { DomainReportPanel } from '@/features/reports/components/domain-report-panel';
import { getDefaultReportFilters, ReportFilters } from '@/features/reports/components/report-filters';
import { StatCardWidget } from '@/features/reports/components/stat-card-widget';
import { TableWidget } from '@/features/reports/components/table-widget';
import { useDomainAnalytics } from '@/features/reports/hooks/use-reports';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';

type AnalyticsTab = 'hr' | 'finance' | 'project' | 'sales' | 'attendance';

const TABS: Array<{ id: AnalyticsTab; label: string; domain: ReportDomain }> = [
  { id: 'hr', label: 'HR', domain: 'hr' },
  { id: 'finance', label: 'Finance', domain: 'finance' },
  { id: 'project', label: 'Project', domain: 'project' },
  { id: 'sales', label: 'Sales', domain: 'sales' },
  { id: 'attendance', label: 'Attendance', domain: 'attendance' },
];

export function AnalyticsHubPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('hr');
  const [filters, setFilters] = useState<ReportFilterParams>(getDefaultReportFilters());
  const [appliedFilters, setAppliedFilters] = useState<ReportFilterParams>(filters);

  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const { data: analytics, isLoading, isError, refetch } = useDomainAnalytics(currentTab.domain, appliedFilters);

  const handleApply = () => {
    setAppliedFilters(filters);
    void refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-6 w-6 text-primary" />}
        title="Analytics Hub"
        description="Cross-domain analytics for HR, finance, projects, sales, and attendance."
      />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ReportFilters value={filters} onChange={setFilters} onApply={handleApply} showSearch={false} />

      {isLoading ? (
        <Loading message={`Loading ${currentTab.label} analytics...`} />
      ) : isError ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Unable to load analytics for {currentTab.label}.
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(analytics.metrics).map(([key, value]) => (
              <StatCardWidget
                key={key}
                title={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                value={value}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {analytics.charts.map((chart) => (
              <section key={chart.id} className="rounded-lg border bg-card p-4">
                <ChartWidget
                  title={chart.title}
                  data={(chart.data.points as ChartDataPoint[] | undefined) ?? []}
                  type={(chart.data.chartType as 'bar' | 'line' | undefined) ?? 'bar'}
                />
              </section>
            ))}
          </div>

          {analytics.tables?.map((table) => (
            <section key={table.id} className="rounded-lg border bg-card p-4">
              <TableWidget
                title={table.title}
                columns={table.columns.map((column) => ({ key: column, header: column.replace(/_/g, ' ') }))}
                rows={table.rows as Array<Record<string, string | number | undefined>>}
              />
            </section>
          ))}

          <DomainReportPanel domain={currentTab.domain} />
        </div>
      ) : null}
    </div>
  );
}
