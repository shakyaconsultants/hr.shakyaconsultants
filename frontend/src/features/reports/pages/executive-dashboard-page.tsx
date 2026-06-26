import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import type { ReportFilterParams } from '@/features/reports/api/reports.api';
import { DashboardWidgetGrid } from '@/features/reports/components/dashboard-widget-grid';
import { getDefaultReportFilters, ReportFilters } from '@/features/reports/components/report-filters';
import { useDashboardConfig, useExecutiveDashboard } from '@/features/reports/hooks/use-reports';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';

export function ExecutiveDashboardPage() {
  const [filters, setFilters] = useState<ReportFilterParams>(getDefaultReportFilters());
  const [appliedFilters, setAppliedFilters] = useState<ReportFilterParams>(filters);

  const { data: dashboard, isLoading, isError, refetch } = useExecutiveDashboard(appliedFilters);
  const { data: config } = useDashboardConfig('executive');

  const handleApply = () => {
    setAppliedFilters(filters);
    void refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6 text-primary" />}
        title="Executive Dashboard"
        description="Enterprise-wide KPIs and configurable widget grid for leadership."
      />

      <ReportFilters
        value={filters}
        onChange={setFilters}
        onApply={handleApply}
        showSearch={false}
      />

      {isLoading ? (
        <Loading message="Loading executive dashboard..." />
      ) : isError ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Unable to load dashboard widgets. Ensure the reports API is available.
        </div>
      ) : dashboard ? (
        <DashboardWidgetGrid widgets={dashboard.widgets} layout={config?.layout} editable />
      ) : null}
    </div>
  );
}
