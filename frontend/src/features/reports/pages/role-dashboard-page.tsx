import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { DashboardRole, ReportFilterParams } from '@/features/reports/api/reports.api';
import { DashboardWidgetGrid } from '@/features/reports/components/dashboard-widget-grid';
import { getDefaultReportFilters, ReportFilters } from '@/features/reports/components/report-filters';
import { useDashboardConfig, useRoleDashboard } from '@/features/reports/hooks/use-reports';
import { Loading } from '@/shared/components/loading';
import { PageHeader } from '@/shared/components/page-header';

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO',
  hr: 'HR Head',
  finance: 'Finance Head',
  project: 'Project Head',
  sales: 'Sales Head',
  operations: 'Operations Head',
};

export function RoleDashboardPage() {
  const { role = 'ceo' } = useParams<{ role: string }>();
  const normalizedRole = role.toLowerCase() as DashboardRole;
  const roleLabel = ROLE_LABELS[normalizedRole] ?? role;

  const [filters, setFilters] = useState<ReportFilterParams>(getDefaultReportFilters());
  const [appliedFilters, setAppliedFilters] = useState<ReportFilterParams>(filters);

  const { data: dashboard, isLoading, isError, refetch } = useRoleDashboard(normalizedRole, appliedFilters);
  const { data: config } = useDashboardConfig(normalizedRole);

  const handleApply = () => {
    setAppliedFilters(filters);
    void refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title={`${roleLabel} Dashboard`}
        description={`Role-specific KPI dashboard for ${roleLabel.toLowerCase()}.`}
      />

      <ReportFilters value={filters} onChange={setFilters} onApply={handleApply} showSearch={false} />

      {isLoading ? (
        <Loading message={`Loading ${roleLabel} dashboard...`} />
      ) : isError ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Unable to load role dashboard widgets.
        </div>
      ) : dashboard ? (
        <DashboardWidgetGrid widgets={dashboard.widgets} layout={config?.layout} editable />
      ) : null}
    </div>
  );
}
