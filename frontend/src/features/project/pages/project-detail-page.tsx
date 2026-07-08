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
import { ProjectDetailView } from '@/features/project/components/project-detail-view';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const { data: dashboard } = useProjectDashboard(id);
  const { data: kanban } = useProjectKanban(id);
  const { data: tasks } = useTasks({ projectId: id, pageSize: 50 });
  const { data: members = [] } = useProjectMembers(id);
  const { data: knowledgeBase } = useProjectKnowledgeBase(id);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const employeeId = useAuthStore((s) => s.user?.employeeId);

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

  const isProjectManager = Boolean(employeeId && project.projectManagerId === employeeId);
  const canAdminister =
    hasPermission('project.update') ||
    hasPermission('project.delete') ||
    hasPermission('project.view_all');
  const canManageTasks = canAdminister || isProjectManager || hasPermission('task.create');
  const canViewEnv =
    canAdminister ||
    isProjectManager ||
    hasPermission('project.manage_environment') ||
    hasPermission('project.knowledge.read');

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.PROJECTS_LIST}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <ProjectDetailView
        project={project}
        projectId={id}
        dashboard={dashboard}
        knowledgeBase={knowledgeBase}
        members={members}
        tasks={tasks?.items ?? []}
        kanban={kanban}
        permissions={{
          canAdminister,
          canManageTasks,
          canViewEnv,
        }}
      />
    </div>
  );
}
