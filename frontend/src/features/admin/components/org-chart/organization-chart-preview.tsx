import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Network } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchReportingTree } from '@/features/employee/api/employee.api';
import { ReportingChartTreeView } from '@/features/admin/components/org-chart/reporting-chart-tree-view';
import { buildOrgChartTree } from '@/features/admin/components/org-chart/build-org-chart-tree';
import { OrgChartTreeView } from '@/features/admin/components/org-chart/org-chart-tree';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { getCompany } from '@/features/organization/api/organization.api';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { ROUTES } from '@/config/app.config';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface OrganizationChartPreviewProps {
  compact?: boolean;
  maxScale?: number;
  className?: string;
  showHeader?: boolean;
}

export function OrganizationChartPreview({
  compact = false,
  maxScale = 0.85,
  className,
  showHeader = true,
}: OrganizationChartPreviewProps) {
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['organization', 'company'],
    queryFn: getCompany,
  });
  const { data: branches, isLoading: branchesLoading } = useMasterDataList('branch', {
    page: 1,
    pageSize: 50,
    status: 'active',
  });
  const { data: departments, isLoading: departmentsLoading } = useMasterDataList('department', {
    page: 1,
    pageSize: 100,
    status: 'active',
  });
  const { data: designations, isLoading: designationsLoading } = useMasterDataList('designation', {
    page: 1,
    pageSize: 100,
    status: 'active',
  });
  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useAllEmployees();

  const { data: reportingTree } = useQuery({
    queryKey: ['employees', 'reporting-tree'],
    queryFn: fetchReportingTree,
  });

  const tree = useMemo(
    () =>
      buildOrgChartTree({
        company,
        branches: branches?.items ?? [],
        departments: departments?.items ?? [],
        designations: designations?.items ?? [],
        employees: employees ?? [],
      }),
    [company, branches?.items, departments?.items, designations?.items, employees],
  );

  const isLoading =
    companyLoading || branchesLoading || departmentsLoading || designationsLoading || employeesLoading;

  if (isLoading) {
    return <Loading message="Loading organization chart..." />;
  }

  if (employeesError) {
    return (
      <p className="text-sm text-muted-foreground">Organization chart preview unavailable — employee data could not be loaded.</p>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Organization Hierarchy</h3>
              <p className="text-xs text-muted-foreground">
                {tree.stats.branches} branches · {tree.stats.departments} departments ·{' '}
                {tree.stats.employees} employees
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.ORGANIZATION_CHART}>
              Open full chart
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          'overflow-x-auto rounded-xl border bg-gradient-to-b from-muted/30 via-background to-background',
          compact ? 'p-4' : 'p-6',
        )}
      >
        {reportingTree && reportingTree.stats.withManager > 0 ? (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reporting lines
            </p>
            <ReportingChartTreeView tree={reportingTree} scale={compact ? maxScale : 0.85} />
          </div>
        ) : null}
        <OrgChartTreeView tree={tree} scale={compact ? maxScale : 1} />
      </div>
    </div>
  );
}
