import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProjectDetailView } from '@/features/project/components/project-detail-view';
import {
  toProjectKnowledgeBase,
  toProjectRecord,
} from '@/features/project/utils/project-record.util';
import type { ProjectMemberTaskItem } from '@/features/project/components/project-member-tasks-panel';
import {
  useMyProject,
  useSubmitTaskForVerification,
} from '@/features/workspace/hooks/use-workspace';
import { PageDataBoundary } from '@/shared/components/page-data-boundary';
import { ROUTES } from '@/config/app.config';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

export function WorkspaceProjectDetailPage() {
  const { id = '' } = useParams();
  const [formError, setFormError] = useState<string | null>(null);
  const { data, isLoading, isError, error: loadError, refetch } = useMyProject(id);
  const submitMutation = useSubmitTaskForVerification();

  if (isLoading || isError || !data) {
    return (
      <PageDataBoundary
        isLoading={isLoading}
        isError={isError}
        error={loadError}
        onRetry={() => void refetch()}
        source="workspace-project-detail"
        loadingFallback={<div className="p-8 text-muted-foreground">Loading project...</div>}
      >
        {null}
      </PageDataBoundary>
    );
  }

  const project = toProjectRecord(data.project);
  const knowledgeBase = toProjectKnowledgeBase(data.knowledgeBase, project);
  const myTasks: ProjectMemberTaskItem[] = data.myTasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority ?? 'p2',
    dueDate: task.dueDate,
  }));

  async function handleSubmit(task: ProjectMemberTaskItem) {
    setFormError(null);
    await runFormMutation({
      setError: setFormError,
      successMessage: 'Task submitted for manager review.',
      mutation: () => submitMutation.mutateAsync(task.id),
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.WORKSPACE_PROJECTS}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My Projects
      </Link>

      <ProjectDetailView
        project={project}
        projectId={id}
        knowledgeBase={knowledgeBase}
        members={data.members}
        myTasks={myTasks}
        memberRole={data.role}
        accessLabel={data.canManage ? 'Project manager access' : 'Team member access'}
        permissions={{
          canAdminister: false,
          canManageTasks: false,
          canViewEnv: data.canViewEnv ?? false,
        }}
        onSubmitTaskForVerification={handleSubmit}
        isSubmittingTask={submitMutation.isPending}
        taskFormError={formError}
      />
    </div>
  );
}
