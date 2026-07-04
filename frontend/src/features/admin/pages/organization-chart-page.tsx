import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Building2,
  GitBranch,
  Layers,
  Minus,
  Network,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMasterDataList } from '@/features/organization/hooks/use-master-data';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { getCompany } from '@/features/organization/api/organization.api';
import {
  buildOrgChartTree,
  filterOrgChartTree,
} from '@/features/admin/components/org-chart/build-org-chart-tree';
import { fetchReportingTree } from '@/features/employee/api/employee.api';
import {
  ReportingChartLegend,
  ReportingChartTreeView,
} from '@/features/admin/components/org-chart/reporting-chart-tree-view';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';

import {
  OrgChartLegend,
  OrgChartTreeView,
  orgChartCanvasClassName,
} from '@/features/admin/components/org-chart/org-chart-tree';

const CHART_VIEWS = ['Structure', 'Reporting Line'] as const;

export function OrganizationChartPage() {
  const [search, setSearch] = useState('');
  const [zoomIndex, setZoomIndex] = useState(2);
  const [view, setView] = useState<(typeof CHART_VIEWS)[number]>('Reporting Line');

  const ZOOM_STEPS = [0.75, 0.9, 1, 1.1, 1.25] as const;

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['organization', 'company'],
    queryFn: getCompany,
  });
  const { data: branches, isLoading: branchesLoading } = useMasterDataList('branch', {
    page: 1,
    pageSize: 100,
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

  const { data: reportingTree, isLoading: reportingLoading } = useQuery({
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

  const displayTree = useMemo(() => filterOrgChartTree(tree, search), [tree, search]);
  const scale = ZOOM_STEPS[zoomIndex] ?? 1;

  const isLoading =
    companyLoading ||
    branchesLoading ||
    departmentsLoading ||
    designationsLoading ||
    employeesLoading ||
    (view === 'Reporting Line' && reportingLoading);

  if (isLoading) {
    return <Loading message="Building organization chart..." />;
  }

  if (employeesError && view === 'Structure') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Unable to load employee data for the organization chart. Ensure you have the <code>employee.read</code> permission.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Network className="h-6 w-6 text-primary" />}
        title="Organization Chart"
        description="Company structure by department and manager reporting lines — admin-controlled hierarchy."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.EMPLOYEES}>Manage employees</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.organizationEntity('branch')}>Manage structure</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1 border-b">
        {CHART_VIEWS.map((tab) => (
          <Button
            key={tab}
            variant={view === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      {view === 'Structure' ? (
        <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Branches" value={String(tree.stats.branches)} icon={GitBranch} />
        <StatCard label="Departments" value={String(tree.stats.departments)} icon={Layers} />
        <StatCard label="Employees" value={String(tree.stats.employees)} icon={Users} />
      </div>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search branches, departments, or people..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Zoom</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={zoomIndex <= 0}
              onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={zoomIndex >= ZOOM_STEPS.length - 1}
              onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <OrgChartLegend />
          {search.trim() ? (
            <p className="text-xs text-muted-foreground">
              Showing filtered view for &ldquo;{search.trim()}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Click chevrons on nodes to expand or collapse sections
            </p>
          )}
        </div>

        <div className={orgChartCanvasClassName('border-0 bg-transparent shadow-none')}>
          {displayTree.branches.length === 0 && search.trim() ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No matches found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different name, department, or email address.
              </p>
            </div>
          ) : (
            <OrgChartTreeView tree={displayTree} scale={scale} />
          )}
        </div>
      </section>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Employees" value={String(reportingTree?.stats.employees ?? 0)} icon={Users} />
            <StatCard label="With manager" value={String(reportingTree?.stats.withManager ?? 0)} icon={GitBranch} />
            <StatCard label="Top-level leaders" value={String(reportingTree?.stats.roots ?? 0)} icon={Network} />
          </div>

          <section className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <ReportingChartLegend />
              <p className="text-xs text-muted-foreground">
                Assign reporting lines from any employee profile → Reporting tab
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">Zoom</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={zoomIndex <= 0}
                onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={zoomIndex >= ZOOM_STEPS.length - 1}
                onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className={orgChartCanvasClassName('border-0 bg-transparent shadow-none')}>
              {reportingTree ? <ReportingChartTreeView tree={reportingTree} scale={scale} /> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
