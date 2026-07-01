import { GitBranch } from 'lucide-react';
import { useOrgChart } from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle?: string;
}

function PersonNode({ person, highlight = false }: { person: PersonSummary; highlight?: boolean }) {
  return (
    <div
      className={`min-w-[180px] rounded-lg border px-4 py-3 text-center shadow-sm ${
        highlight ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'bg-card'
      }`}
    >
      <p className="font-semibold">
        {person.firstName} {person.lastName}
      </p>
      {person.jobTitle ? <p className="mt-1 text-xs text-muted-foreground">{person.jobTitle}</p> : null}
      {person.email ? <p className="mt-1 text-xs text-muted-foreground">{person.email}</p> : null}
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
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Department</p>
            <p className="mt-1 font-semibold">{departmentName}</p>
          </div>
        ) : null}
        {branchName ? (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Branch</p>
            <p className="mt-1 font-semibold">{branchName}</p>
          </div>
        ) : null}
      </div>

      <section className="overflow-x-auto rounded-lg border bg-card p-6">
        <div className="flex min-w-max flex-col items-center gap-6">
          {hierarchy.managers.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reports to</p>
              <div className="flex flex-wrap justify-center gap-4">
                {hierarchy.managers.map((manager) => (
                  <PersonNode key={manager.id} person={manager} />
                ))}
              </div>
              <GitBranch className="h-5 w-5 rotate-180 text-muted-foreground" />
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">You</p>
            <PersonNode person={hierarchy.self} highlight />
          </div>

          {hierarchy.peers.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Peers</p>
              <div className="flex flex-wrap justify-center gap-4">
                {hierarchy.peers.map((peer) => (
                  <PersonNode key={peer.id} person={peer} />
                ))}
              </div>
            </div>
          ) : null}

          {hierarchy.directReports.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Direct reports</p>
              <div className="flex flex-wrap justify-center gap-4">
                {hierarchy.directReports.map((report) => (
                  <PersonNode key={report.id} person={report} />
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
    </div>
  );
}
