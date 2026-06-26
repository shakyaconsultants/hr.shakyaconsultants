import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useManagerDashboard, useProjects } from '@/features/project/hooks/use-projects';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function ProjectsDashboardPage() {
  const { data: dashboard, isLoading } = useManagerDashboard();
  const { data: projects } = useProjects({ pageSize: 5 });

  if (isLoading) {
    return <Loading message="Loading project dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Briefcase className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Projects</h1>
          </div>
          <p className="text-sm text-muted-foreground">Operational core for software development teams.</p>
        </div>
        <Button asChild>
          <Link to={ROUTES.PROJECTS_LIST}>View All Projects</Link>
        </Button>
      </div>

      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Briefcase} label="Active Projects" value={dashboard.activeProjects} />
          <StatCard icon={CheckCircle2} label="Total Tasks" value={dashboard.totalTasks} />
          <StatCard icon={AlertTriangle} label="Blocked Tasks" value={dashboard.blockedTasks} />
          <StatCard icon={Clock} label="Overdue Tasks" value={dashboard.overdueTasks} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Projects</h2>
          <ul className="space-y-2">
            {(projects?.items ?? []).map((project) => (
              <li key={project.id}>
                <Link to={ROUTES.projectDetail(project.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm hover:bg-muted">
                  <span className="font-medium">{project.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <ul className="space-y-3">
            {(dashboard?.recentActivity ?? []).slice(0, 8).map((activity) => (
              <li key={activity.id} className="border-b pb-2 text-sm last:border-0">
                <p>{activity.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
