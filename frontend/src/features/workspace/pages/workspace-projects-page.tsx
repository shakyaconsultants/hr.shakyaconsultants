import { Link } from 'react-router-dom';
import { useMyProjects } from '@/features/workspace/hooks/use-workspace';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { Loading } from '@/shared/components/loading';
import { ROUTES } from '@/config/app.config';
import { EmptyState } from '@/features/workspace/components/widget-primitives';

export function WorkspaceProjectsPage() {
  const { data, isLoading } = useMyProjects();

  if (isLoading) return <Loading message="Loading projects..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Projects" description="Projects you are assigned to with progress and deadlines." />
      {(data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No projects assigned" description="You will see assigned projects here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.items.map((item) => {
            const project = item.project as Record<string, unknown>;
            return (
              <article key={String(project.id)} className="rounded-lg border bg-card p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <Link to={ROUTES.projectDetail(String(project.id))} className="text-lg font-semibold hover:underline">
                      {String(project.name)}
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground">{String(project.code)}</p>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-xs">{item.role ?? 'member'}</span>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{item.progress}%</span>
                </div>
                <div className="mb-4 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{item.completedTasks}/{item.totalTasks} tasks completed</p>
                {item.upcomingDeadlines.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-1 text-xs font-medium">Upcoming deadlines</p>
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
