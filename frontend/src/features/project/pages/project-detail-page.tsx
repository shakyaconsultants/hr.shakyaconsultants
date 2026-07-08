import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useProject,
  useProjectDashboard,
  useProjectKanban,
  useProjectKnowledgeBase,
  useProjectMembers,
  useTasks,
} from '@/features/project/hooks/use-projects';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import type { TaskRecord } from '@/features/project/api/project.api';
import { ProjectAdministrationPanel } from '@/features/project/components/project-administration-panel';
import { ProjectDeploymentTab } from '@/features/project/components/project-deployment-tab';
import { ProjectMembersTab } from '@/features/project/components/project-members-tab';
import { ProjectOverviewTab } from '@/features/project/components/project-overview-tab';
import { ProjectTaskManagementPanel } from '@/features/project/components/project-task-management-panel';
import { TaskPriorityBadge } from '@/features/project/components/task-priority-badge';
import { useAuthStore } from '@/shared/stores/app.store';

const TABS = ['Overview', 'Tasks', 'Kanban', 'Deployment', 'Members', 'Administration'] as const;

function formatStatus(slug: string): string {
  return slug
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [showEnv, setShowEnv] = useState(false);
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const { data: dashboard } = useProjectDashboard(id);
  const { data: kanban } = useProjectKanban(id);
  const { data: tasks } = useTasks({ projectId: id, pageSize: 50 });
  const { data: members = [] } = useProjectMembers(id);
  const { data: knowledgeBase } = useProjectKnowledgeBase(id);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const employeeId = useAuthStore((s) => s.user?.employeeId);
  const canAdminister =
    hasPermission('project.update') ||
    hasPermission('project.delete') ||
    hasPermission('project.view_all');

  if (isLoading || isError || !project) {
    return (
      <PageDataBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        source="project-detail"
        loadingFallback={<div className="p-8 text-muted-foreground">Loading project...</div>}
      >
        {null}
      </PageDataBoundary>
    );
  }

  const currentProject = project;
  const isProjectManager = Boolean(employeeId && currentProject.projectManagerId === employeeId);
  const canManageTasks = canAdminister || isProjectManager || hasPermission('task.create');
  const canViewEnv = canAdminister || isProjectManager;

  function exportEnvFile() {
    const content = knowledgeBase?.envVariables ?? '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.code}-env.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.PROJECTS_LIST}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <div className="flex flex-wrap items-start gap-6 rounded-xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm">
        {project.logoUrl ? (
          <img
            src={currentProject.logoUrl}
            alt=""
            className="h-16 w-16 rounded-xl object-cover ring-2 ring-primary/10"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/10">
            {currentProject.code.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{currentProject.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{currentProject.code}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {formatStatus(currentProject.status)}
            </span>
            {currentProject.projectKind && (
              <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs">
                {currentProject.projectKind === 'internal' ? 'In-house' : 'External'}
              </span>
            )}
            <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs capitalize">
              {currentProject.priority} priority
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-md"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {activeTab === 'Overview' && (
          <ProjectOverviewTab project={currentProject} dashboard={dashboard} />
        )}

        {activeTab === 'Tasks' && (
          <ProjectTaskManagementPanel
            projectId={id}
            projectManagerId={currentProject.projectManagerId}
            tasks={tasks?.items ?? []}
            canManage={canManageTasks}
          />
        )}

        {activeTab === 'Kanban' && kanban && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanban.columns ?? {}).map(([status, cards]) => (
              <div
                key={status}
                className="min-w-[280px] flex-shrink-0 rounded-xl border bg-muted/20 shadow-sm"
              >
                <div className="border-b px-4 py-3 text-sm font-semibold">
                  {formatStatus(status)} ({cards.length})
                </div>
                <div className="space-y-2 p-3">
                  {cards.map((task: TaskRecord) => (
                    <div key={task.id} className="rounded-lg border bg-card p-3 text-sm shadow-sm">
                      <p className="font-medium">{task.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TaskPriorityBadge priority={task.priority} />
                        <span className="text-xs text-muted-foreground">
                          {task.progressPercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Deployment' && (
          <ProjectDeploymentTab
            project={currentProject}
            knowledgeBase={knowledgeBase}
            showEnv={showEnv}
            onToggleEnv={() => setShowEnv((v) => !v)}
            canViewEnv={canViewEnv}
            onExportEnv={exportEnvFile}
          />
        )}

        {activeTab === 'Members' && <ProjectMembersTab members={members} />}

        {activeTab === 'Administration' && canAdminister ? (
          <ProjectAdministrationPanel project={currentProject} />
        ) : null}

        {activeTab === 'Administration' && !canAdminister ? (
          <p className="text-sm text-muted-foreground">
            You do not have permission to administer this project.
          </p>
        ) : null}
      </div>
    </div>
  );
}
