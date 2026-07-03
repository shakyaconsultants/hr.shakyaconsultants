import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import {
  useProject,
  useProjectDashboard,
  useProjectKanban,
  useProjectKnowledgeBase,
  useProjectMembers,
  useTasks,
} from '@/features/project/hooks/use-projects';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { TaskRecord } from '@/features/project/api/project.api';
import { ProjectAdministrationPanel } from '@/features/project/components/project-administration-panel';
import { ProjectTaskManagementPanel } from '@/features/project/components/project-task-management-panel';
import { useAuthStore } from '@/shared/stores/app.store';

const TABS = ['Overview', 'Tasks', 'Kanban', 'Deployment', 'Members', 'Administration'] as const;

function formatStatus(slug: string): string {
  return slug.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [showEnv, setShowEnv] = useState(false);
  const { data: project, isLoading } = useProject(id);
  const { data: dashboard } = useProjectDashboard(id);
  const { data: kanban } = useProjectKanban(id);
  const { data: tasks } = useTasks({ projectId: id, pageSize: 50 });
  const { data: members = [] } = useProjectMembers(id);
  const { data: knowledgeBase } = useProjectKnowledgeBase(id);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const employeeId = useAuthStore((s) => s.user?.employeeId);
  const canAdminister = hasPermission('project.update') || hasPermission('project.delete') || hasPermission('project.view_all');
  const isProjectManager = Boolean(project && employeeId && project.projectManagerId === employeeId);
  const canManageTasks = canAdminister || isProjectManager || hasPermission('task.create');

  if (isLoading || !project) {
    return <Loading message="Loading project..." />;
  }

  function exportEnvFile() {
    if (!project) return;
    const content = knowledgeBase?.envVariables ?? '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.code}-env.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{formatStatus(project.status)}</span>
            {project.projectKind && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{project.projectKind === 'internal' ? 'In-house' : 'External'}</span>
            )}
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
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {dashboard && (
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-sm text-muted-foreground">Total Tasks</dt><dd className="text-xl font-semibold">{dashboard.totalTasks}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Blocked</dt><dd className="text-xl font-semibold">{dashboard.blockedTasks}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Overdue</dt><dd className="text-xl font-semibold">{dashboard.overdueTasks}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Pending Verifications</dt><dd className="text-xl font-semibold">{dashboard.pendingVerifications ?? 0}</dd></div>
              </dl>
            )}
            <dl className="grid gap-4 sm:grid-cols-2">
              {project.description && (
                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Summary</dt><dd className="mt-1">{project.description}</dd></div>
              )}
              {project.requirements && (
                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Requirements</dt><dd className="mt-1 whitespace-pre-wrap">{project.requirements}</dd></div>
              )}
              {project.uiDocs && (
                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">UI / Design Docs</dt><dd className="mt-1 whitespace-pre-wrap">{project.uiDocs}</dd></div>
              )}
              {project.scalabilityNotes && (
                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Scalability & Tech Stack</dt><dd className="mt-1 whitespace-pre-wrap">{project.scalabilityNotes}</dd></div>
              )}
              {project.startDate && (
                <div><dt className="text-sm text-muted-foreground">Start Date</dt><dd>{new Date(project.startDate).toLocaleDateString()}</dd></div>
              )}
              {project.endDate && (
                <div><dt className="text-sm text-muted-foreground">End Date</dt><dd>{new Date(project.endDate).toLocaleDateString()}</dd></div>
              )}
              {project.clientName && (
                <div><dt className="text-sm text-muted-foreground">Client</dt><dd>{project.clientName}</dd></div>
              )}
            </dl>
          </div>
        )}

        {activeTab === 'Tasks' && (
          <ProjectTaskManagementPanel
            projectId={id}
            projectManagerId={project.projectManagerId}
            tasks={tasks?.items ?? []}
            canManage={canManageTasks}
          />
        )}

        {activeTab === 'Kanban' && kanban && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanban.columns ?? {}).map(([status, cards]) => (
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

        {activeTab === 'Deployment' && (
          <div className="space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Repository</dt>
              <dd className="mt-1">
                {knowledgeBase?.repositoryUrl ? (
                  <a href={knowledgeBase.repositoryUrl} target="_blank" rel="noreferrer" className="text-primary underline">{knowledgeBase.repositoryUrl}</a>
                ) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Deployment Guide</dt>
              <dd className="mt-1 whitespace-pre-wrap">{knowledgeBase?.deploymentGuide ?? '—'}</dd>
            </div>
            {canAdminister || isProjectManager ? (
              <div>
                <dt className="mb-2 text-muted-foreground">Environment Variables</dt>
                <div className="flex gap-2 mb-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowEnv((v) => !v)}>
                    {showEnv ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                    {showEnv ? 'Hide' : 'View'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={exportEnvFile} disabled={!knowledgeBase?.envVariables}>
                    Export .env
                  </Button>
                </div>
                <pre
                  className="max-h-48 overflow-auto rounded border bg-muted/30 p-3 font-mono text-xs"
                  style={!showEnv ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : undefined}
                >
                  {knowledgeBase?.envVariables ?? 'Not configured'}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground">Environment variables are only visible to project managers and admins.</p>
            )}
          </div>
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
