import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useProject,
  useProjectDashboard,
  useProjectKanban,
  useProjectMembers,
  useProjectSprints,
  useTasks,
} from '@/features/project/hooks/use-projects';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { TaskRecord } from '@/features/project/api/project.api';
import { ProjectAdministrationPanel } from '@/features/project/components/project-administration-panel';
import { useAuthStore } from '@/shared/stores/app.store';

const TABS = ['Overview', 'Kanban', 'Tasks', 'Sprints', 'Members', 'Administration'] as const;

function formatStatus(slug: string): string {
  return slug.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const { data: project, isLoading } = useProject(id);
  const { data: dashboard } = useProjectDashboard(id);
  const { data: kanban } = useProjectKanban(id);
  const { data: tasks } = useTasks({ projectId: id, pageSize: 50 });
  const { data: members = [] } = useProjectMembers(id);
  const { data: sprints = [] } = useProjectSprints(id);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canAdminister = hasPermission('project.update') || hasPermission('project.delete');

  if (isLoading || !project) {
    return <Loading message="Loading project..." />;
  }

  return (
    <div className="space-y-6">
      <Link to={ROUTES.PROJECTS_LIST} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <div className="flex flex-wrap items-start gap-6 rounded-lg border bg-card p-6">
        {project.logoUrl ? (
          <img src={project.logoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
            {project.code.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{project.code}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{project.status}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{project.priority}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)} className="rounded-b-none">
            {tab}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {activeTab === 'Overview' && dashboard && (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-sm text-muted-foreground">Total Tasks</dt><dd className="text-xl font-semibold">{dashboard.totalTasks}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Blocked</dt><dd className="text-xl font-semibold">{dashboard.blockedTasks}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Overdue</dt><dd className="text-xl font-semibold">{dashboard.overdueTasks}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Active Sprints</dt><dd className="text-xl font-semibold">{dashboard.activeSprints}</dd></div>
            {project.description && (
              <div className="sm:col-span-2 lg:col-span-4"><dt className="text-sm text-muted-foreground">Description</dt><dd>{project.description}</dd></div>
            )}
          </dl>
        )}

        {activeTab === 'Kanban' && kanban && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanban.columns).map(([status, cards]) => (
              <div key={status} className="min-w-[260px] flex-shrink-0 rounded-lg border bg-muted/30">
                <div className="border-b px-3 py-2 text-sm font-semibold">{formatStatus(status)} ({cards.length})</div>
                <div className="space-y-2 p-2">
                  {cards.map((task: TaskRecord) => (
                    <div key={task.id} className="rounded-md border bg-card p-3 text-sm shadow-sm">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.priority} · {task.progressPercent}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Tasks' && (
          <ul className="space-y-2">
            {(tasks?.items ?? []).map((task) => (
              <li key={task.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span>{task.title}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs">{formatStatus(task.status)}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'Sprints' && (
          <ul className="space-y-2">
            {sprints.map((sprint) => (
              <li key={String(sprint.id)} className="rounded border px-3 py-2 text-sm">
                <p className="font-medium">{String(sprint.name)}</p>
                <p className="text-muted-foreground">{String(sprint.status)}</p>
              </li>
            ))}
            {sprints.length === 0 && <p className="text-sm text-muted-foreground">No sprints yet.</p>}
          </ul>
        )}

        {activeTab === 'Members' && (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={String(member.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span className="font-mono text-xs">{String(member.employeeId)}</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs">{String(member.role)}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'Administration' && canAdminister && project ? (
          <ProjectAdministrationPanel project={project} />
        ) : null}

        {activeTab === 'Administration' && !canAdminister ? (
          <p className="text-sm text-muted-foreground">You do not have permission to administer this project.</p>
        ) : null}
      </div>
    </div>
  );
}
