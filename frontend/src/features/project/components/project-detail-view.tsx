import { useMemo, useState } from 'react';
import type {
  ManagerDashboard,
  ProjectKnowledgeBase,
  ProjectMemberRecord,
  ProjectRecord,
  TaskRecord,
} from '@/features/project/api/project.api';
import type { ProjectMemberTaskItem } from '@/features/project/components/project-member-tasks-panel';
import { ProjectAdministrationPanel } from '@/features/project/components/project-administration-panel';
import { ProjectDeploymentTab } from '@/features/project/components/project-deployment-tab';
import { ProjectDetailHeader } from '@/features/project/components/project-detail-header';
import { ProjectMemberTasksPanel } from '@/features/project/components/project-member-tasks-panel';
import { ProjectMembersTab } from '@/features/project/components/project-members-tab';
import { ProjectOverviewTab } from '@/features/project/components/project-overview-tab';
import { ProjectTaskManagementPanel } from '@/features/project/components/project-task-management-panel';
import { TaskPriorityBadge } from '@/features/project/components/task-priority-badge';
import { formatProjectStatus } from '@/features/project/utils/project-display.util';
import { Button } from '@/shared/components/ui/button';

export interface ProjectDetailPermissions {
  canAdminister: boolean;
  canManageTasks: boolean;
  canViewEnv: boolean;
}

export interface ProjectDetailViewProps {
  project: ProjectRecord;
  projectId: string;
  dashboard?: ManagerDashboard | null;
  knowledgeBase?: ProjectKnowledgeBase | null;
  members: ProjectMemberRecord[];
  tasks?: TaskRecord[];
  myTasks?: ProjectMemberTaskItem[];
  kanban?: { columns: Record<string, TaskRecord[]>; total: number } | null;
  memberRole?: string;
  accessLabel?: string;
  permissions: ProjectDetailPermissions;
  onSubmitTaskForVerification?: (task: ProjectMemberTaskItem) => Promise<void>;
  isSubmittingTask?: boolean;
  taskFormError?: string | null;
}

const ADMIN_TABS = [
  'Overview',
  'Tasks',
  'Kanban',
  'Deployment',
  'Members',
  'Administration',
] as const;

const MEMBER_TABS = ['Overview', 'My Tasks', 'Deployment', 'Members'] as const;

export function ProjectDetailView({
  project,
  projectId,
  dashboard,
  knowledgeBase,
  members,
  tasks = [],
  myTasks = [],
  kanban,
  memberRole,
  accessLabel,
  permissions,
  onSubmitTaskForVerification,
  isSubmittingTask,
  taskFormError,
}: ProjectDetailViewProps) {
  const isMemberPortal = Boolean(memberRole);
  const tabs = isMemberPortal ? MEMBER_TABS : ADMIN_TABS;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [showEnv, setShowEnv] = useState(false);

  const visibleTabs = useMemo(() => {
    if (isMemberPortal) return MEMBER_TABS;
    return ADMIN_TABS.filter((tab) => tab !== 'Administration' || permissions.canAdminister);
  }, [isMemberPortal, permissions.canAdminister]);

  function exportEnvFile() {
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
    <>
      <ProjectDetailHeader project={project} memberRole={memberRole} accessLabel={accessLabel} />

      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {visibleTabs.map((tab) => (
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
        {activeTab === 'Overview' && <ProjectOverviewTab project={project} dashboard={dashboard} />}

        {activeTab === 'Tasks' && !isMemberPortal && (
          <ProjectTaskManagementPanel
            projectId={projectId}
            projectManagerId={project.projectManagerId}
            tasks={tasks}
            canManage={permissions.canManageTasks}
          />
        )}

        {activeTab === 'My Tasks' && isMemberPortal && onSubmitTaskForVerification && (
          <ProjectMemberTasksPanel
            tasks={myTasks}
            onSubmitForVerification={onSubmitTaskForVerification}
            isSubmitting={isSubmittingTask}
            error={taskFormError}
          />
        )}

        {activeTab === 'Kanban' && !isMemberPortal && kanban && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(kanban.columns ?? {}).map(([status, cards]) => (
              <div
                key={status}
                className="min-w-[280px] flex-shrink-0 rounded-xl border bg-muted/20 shadow-sm"
              >
                <div className="border-b px-4 py-3 text-sm font-semibold">
                  {formatProjectStatus(status)} ({cards.length})
                </div>
                <div className="space-y-2 p-3">
                  {cards.map((task) => (
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
            project={project}
            knowledgeBase={knowledgeBase}
            showEnv={showEnv}
            onToggleEnv={() => setShowEnv((value) => !value)}
            canViewEnv={permissions.canViewEnv}
            onExportEnv={exportEnvFile}
          />
        )}

        {activeTab === 'Members' && <ProjectMembersTab members={members} />}

        {activeTab === 'Administration' && !isMemberPortal && permissions.canAdminister && (
          <ProjectAdministrationPanel project={project} />
        )}

        {activeTab === 'Administration' && !isMemberPortal && !permissions.canAdminister && (
          <p className="text-sm text-muted-foreground">
            You do not have permission to administer this project.
          </p>
        )}
      </div>
    </>
  );
}
