import { Link } from 'react-router-dom';
import { AlertTriangle, Briefcase, CheckCircle2, Clock, DollarSign, Plus, TrendingUp } from 'lucide-react';
import { useEnterpriseDashboard, useManagerDashboard, useProjects } from '@/features/project/hooks/use-projects';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function ProjectsDashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isEnterprise = hasPermission('project.view_all');
  const enterpriseQuery = useEnterpriseDashboard();
  const managerQuery = useManagerDashboard();
  const { data: dashboard, isLoading } = isEnterprise ? enterpriseQuery : managerQuery;
  const { data: projects } = useProjects({ pageSize: 5, scope: isEnterprise ? 'all' : 'assigned' });

  if (isLoading) {
    return <Loading message="Loading project dashboard..." />;
  }

  const enterprise = isEnterprise ? enterpriseQuery.data : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Briefcase className="h-5 w-5" />
            <h1 className="text-2xl font-bold">{isEnterprise ? 'Enterprise Project Dashboard' : 'Manager Project Dashboard'}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEnterprise ? 'Portfolio health, budget, resources, and project creation.' : 'Assigned projects, sprint progress, and team workload.'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission('project.create') && (
            <Button asChild>
              <Link to={ROUTES.PROJECTS_CREATE}><Plus className="mr-2 h-4 w-4" />Create Project</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={ROUTES.PROJECTS_LIST}>View All Projects</Link>
          </Button>
        </div>
      </div>

      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Briefcase} label="Active Projects" value={dashboard.activeProjects} />
          <StatCard icon={CheckCircle2} label="Total Tasks" value={dashboard.totalTasks} />
          <StatCard icon={AlertTriangle} label="Blocked Tasks" value={dashboard.blockedTasks} />
          <StatCard icon={Clock} label="Overdue Tasks" value={dashboard.overdueTasks} />
        </div>
      )}

      {enterprise && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={TrendingUp} label="Projects At Risk" value={enterprise.projectsAtRisk} />
          <StatCard icon={DollarSign} label="Total Budget" value={enterprise.budgetSummary.totalBudget} prefix={enterprise.budgetSummary.currency} />
          <StatCard icon={CheckCircle2} label="Healthy Projects" value={enterprise.projectHealth.healthy} />
          <StatCard icon={AlertTriangle} label="Critical Projects" value={enterprise.projectHealth.critical} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{isEnterprise ? 'Recent Projects' : 'Assigned Projects'}</h2>
          <ul className="space-y-2">
            {(enterprise?.recentProjects ?? projects?.items ?? []).slice(0, 8).map((project) => (
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
          <h2 className="mb-4 text-lg font-semibold">Upcoming Deadlines</h2>
          <ul className="space-y-2">
            {(dashboard?.upcomingDeadlines ?? []).slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span>{item.title}</span>
                <span className="text-xs text-muted-foreground">{new Date(item.dueDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>

        {dashboard && 'pendingVerifications' in dashboard && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Manager Operations</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Pending Verifications" value={dashboard.pendingVerifications} />
              <MiniStat label="Active Sprints" value={dashboard.activeSprints} />
              <MiniStat label="Blocked" value={dashboard.blockedTasks} />
            </div>
          </section>
        )}

        {enterprise && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Resource Allocation</h2>
            <ul className="space-y-2 text-sm">
              {enterprise.resourceAllocation.slice(0, 8).map((row) => (
                <li key={row.employeeId} className="flex justify-between border-b pb-2 last:border-0">
                  <span className="font-mono text-xs">{row.employeeId.slice(0, 8)}…</span>
                  <span>{row.projectCount} projects · {row.totalAllocation}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg border bg-card p-6 lg:col-span-2">
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

function StatCard({ icon: Icon, label, value, prefix }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; prefix?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{prefix ? `${prefix} ${value.toLocaleString()}` : value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
