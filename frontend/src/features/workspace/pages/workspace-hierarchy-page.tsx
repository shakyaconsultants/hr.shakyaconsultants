import { Link } from 'react-router-dom';
import { useOrgChart } from '@/features/workspace/hooks/use-workspace';
import { OrgChartConnector } from '@/features/admin/components/org-chart/org-chart-nodes';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle?: string;
}

function ReportingPersonCard({ person, highlight = false }: { person: PersonSummary; highlight?: boolean }) {
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();

  return (
    <div
      className={cn(
        'min-w-[200px] max-w-[240px] rounded-xl border px-4 py-3 shadow-sm transition-all',
        highlight
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'bg-card hover:border-primary/30 hover:shadow-md',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate font-semibold">{fullName}</p>
          {person.jobTitle ? (
            <p className="truncate text-xs text-muted-foreground">{person.jobTitle}</p>
          ) : null}
          {person.email ? (
            <p className="truncate text-[11px] text-muted-foreground/80">{person.email}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceHierarchyPage() {
  const { data: hierarchy, isLoading } = useOrgChart();

  if (isLoading) {
    return <Loading message="Loading organization position..." />;
  }

  if (!hierarchy) {
    return <EmptyState title="Hierarchy unavailable" description="Your reporting structure could not be loaded." />;
  }

  const departmentName =
    hierarchy.department && typeof hierarchy.department === 'object' && 'name' in hierarchy.department
      ? String(hierarchy.department.name)
      : null;
  const branchName =
    hierarchy.branch && typeof hierarchy.branch === 'object' && 'name' in hierarchy.branch
      ? String(hierarchy.branch.name)
      : null;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="My Position"
        description="Where you sit in the organization — reporting line, department, and team."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {departmentName ? (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Department</p>
            <p className="mt-1 text-lg font-semibold">{departmentName}</p>
          </div>
        ) : null}
        {branchName ? (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Branch</p>
            <p className="mt-1 text-lg font-semibold">{branchName}</p>
          </div>
        ) : null}
      </div>

      <section className="overflow-x-auto rounded-xl border bg-gradient-to-b from-muted/30 via-background to-background p-8 shadow-sm">
        <div className="flex min-w-max flex-col items-center gap-2 pb-4">
          {hierarchy.managers.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reports to</p>
              <div className="flex flex-wrap justify-center gap-4">
                {hierarchy.managers.map((manager) => (
                  <ReportingPersonCard key={manager.id} person={manager} />
                ))}
              </div>
              <OrgChartConnector />
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">You</p>
            <ReportingPersonCard person={hierarchy.self} highlight />
          </div>

          {hierarchy.peers.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <OrgChartConnector />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Peers</p>
              <div className="flex flex-wrap justify-center gap-4">
                {hierarchy.peers.map((peer) => (
                  <ReportingPersonCard key={peer.id} person={peer} />
                ))}
              </div>
            </div>
          ) : null}

          {hierarchy.directReports.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <OrgChartConnector />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Direct reports</p>
              <div className="flex flex-wrap justify-center gap-4">
                {hierarchy.directReports.map((report) => (
                  <ReportingPersonCard key={report.id} person={report} />
                ))}
              </div>
            </div>
          ) : null}

          {hierarchy.managers.length === 0 &&
          hierarchy.peers.length === 0 &&
          hierarchy.directReports.length === 0 ? (
            <EmptyState
              title="No reporting relationships yet"
              description="HR has not configured your manager or team reporting line."
            />
          ) : null}
        </div>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        View the full company structure in{' '}
        <Link to={ROUTES.ORGANIZATION_CHART} className="font-medium text-primary hover:underline">
          Organization Chart
        </Link>
        {' '}(admin access required).
      </p>
    </div>
  );
}
