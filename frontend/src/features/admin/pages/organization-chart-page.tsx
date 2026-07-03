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
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { getCompany } from '@/features/organization/api/organization.api';
import {
  buildOrgChartTree,
  filterOrgChartTree,
} from '@/features/admin/components/org-chart/build-org-chart-tree';
import {
  OrgChartLegend,
  OrgChartTreeView,
  orgChartCanvasClassName,
} from '@/features/admin/components/org-chart/org-chart-tree';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { StatCard } from '@/shared/components/stat-card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';

const ZOOM_STEPS = [0.75, 0.9, 1, 1.1, 1.25] as const;

export function OrganizationChartPage() {
  const [search, setSearch] = useState('');
  const [zoomIndex, setZoomIndex] = useState(2);

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
    pageSize: 200,
    status: 'active',
  });
  const { data: designations, isLoading: designationsLoading } = useMasterDataList('designation', {
    page: 1,
    pageSize: 200,
    status: 'active',
  });
  const { data: employees, isLoading: employeesLoading } = useEmployees({
    page: 1,
    pageSize: 500,
    status: 'active',
  });

  const tree = useMemo(
    () =>
      buildOrgChartTree({
        company,
        branches: branches?.items ?? [],
        departments: departments?.items ?? [],
        designations: designations?.items ?? [],
        employees: employees?.items ?? [],
      }),
    [company, branches?.items, departments?.items, designations?.items, employees?.items],
  );

  const displayTree = useMemo(() => filterOrgChartTree(tree, search), [tree, search]);
  const scale = ZOOM_STEPS[zoomIndex] ?? 1;

  const isLoading =
    companyLoading || branchesLoading || departmentsLoading || designationsLoading || employeesLoading;

  if (isLoading) {
    return <Loading message="Building organization chart..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Network className="h-6 w-6 text-primary" />}
        title="Organization Chart"
        description="Interactive hierarchy view of your company structure — branches, departments, and team members."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.organizationEntity('branch')}>Manage structure</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Branches" value={String(tree.stats.branches)} icon={GitBranch} />
        <StatCard label="Departments" value={String(tree.stats.departments)} icon={Layers} />
        <StatCard label="Active employees" value={String(tree.stats.employees)} icon={Users} />
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
    </div>
  );
}
