import { Link } from 'react-router-dom';
import { useMyProjects } from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

function formatRole(role?: string): string {
  if (!role) return 'Member';
  return role.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function WorkspaceProjectsPage() {
  const { data, isLoading } = useMyProjects();

  if (isLoading) return <Loading message="Loading projects..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Projects" description="Projects you are assigned to — view details and manage your tasks." />
      {(data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No projects assigned" description="When you are added to a project team, it will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.items.map((item) => {
            const project = item.project as Record<string, unknown>;
            const projectId = String(project.id);
            return (
              <article key={projectId} className="rounded-lg border bg-card p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <Link to={ROUTES.workspaceProjectDetail(projectId)} className="text-lg font-semibold hover:underline">
                      {String(project.name)}
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground">{String(project.code)}</p>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-xs">{formatRole(item.role)}</span>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{item.progress}%</span>
                </div>
                <div className="mb-4 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.myTaskCount ?? 0} tasks assigned to you · {item.completedTasks}/{item.totalTasks} project tasks done
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link to={ROUTES.workspaceProjectDetail(projectId)} className="text-sm font-medium text-primary hover:underline">
                    View project
                  </Link>
                  <Link to={ROUTES.workspaceProjectTasks(projectId)} className="text-sm text-muted-foreground hover:underline">
                    My tasks
                  </Link>
                </div>
                {item.upcomingDeadlines.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-1 text-xs font-medium">Your upcoming deadlines</p>
                    <ul className="text-xs text-muted-foreground">
                      {item.upcomingDeadlines.slice(0, 3).map((d) => (
                        <li key={String(d.id)}>{String(d.title)} — {d.dueDate ? new Date(String(d.dueDate)).toLocaleDateString() : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
