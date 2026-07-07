import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  archiveProject,
  assignProjectMember,
  createProject,
  createProjectMilestone,
  createProjectModule,
  createProjectSprint,
  createTask,
  deleteProject,
  deleteProjectMilestone,
  deleteProjectModule,
  deleteWizardDraft,
  fetchEnterpriseDashboard,
  fetchManagerDashboard,
  fetchProject,
  fetchProjectDashboard,
  approveTaskVerification,
  rejectTaskVerification,
  fetchTaskVerifications,
  fetchProjectKanban,
  fetchProjectKnowledgeBase,
  fetchProjectMembers,
  fetchProjectMilestones,
  fetchProjectModules,
  fetchProjectSprints,
  fetchProjects,
  fetchTask,
  fetchTasks,
  fetchWizardDraft,
  finalizeProjectWizard,
  removeProjectMember,
  restoreProject,
  saveWizardDraft,
  updateProject,
  updateProjectSprint,
  updateTask,
  upsertProjectKnowledgeBase,
  type ListProjectsParams,
  type ListTasksParams,
  type ProjectKnowledgeBase,
} from '@/features/project/api/project.api';

export function useManagerDashboard() {
  return useQuery({
    queryKey: ['projects', 'dashboard', 'manager'],
    queryFn: fetchManagerDashboard,
  });
}

export function useEnterpriseDashboard() {
  return useQuery({
    queryKey: ['projects', 'dashboard', 'enterprise'],
    queryFn: fetchEnterpriseDashboard,
  });
}

export function useProjectWizardDraft() {
  return useQuery({ queryKey: ['projects', 'wizard', 'draft'], queryFn: fetchWizardDraft });
}

export function useSaveProjectWizardDraft() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: saveWizardDraft,
    errorToast: false,
    successMessage: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'wizard', 'draft'] }),
  });
}

export function useFinalizeProjectWizard() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: finalizeProjectWizard,
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: ['projects', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['projects', 'wizard', 'draft'] });
    },
  });
}

export function useDeleteProjectWizardDraft() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: deleteWizardDraft,
    errorToast: false,
    successMessage: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'wizard', 'draft'] }),
  });
}

export function useProjects(params: ListProjectsParams = {}) {
  return useQuery({ queryKey: ['projects', params], queryFn: () => fetchProjects(params) });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    enabled: Boolean(id),
  });
}

export function useProjectDashboard(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'dashboard'],
    queryFn: () => fetchProjectDashboard(projectId),
    enabled: Boolean(projectId),
  });
}

export function useTasks(params: ListTasksParams = {}) {
  return useQuery({ queryKey: ['tasks', params], queryFn: () => fetchTasks(params) });
}

export function useTask(id: string) {
  return useQuery({ queryKey: ['task', id], queryFn: () => fetchTask(id), enabled: Boolean(id) });
}

export function useProjectKanban(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'kanban'],
    queryFn: () => fetchProjectKanban(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'members'],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectSprints(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'sprints'],
    queryFn: () => fetchProjectSprints(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectModules(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'modules'],
    queryFn: () => fetchProjectModules(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'milestones'],
    queryFn: () => fetchProjectMilestones(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectKnowledgeBase(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'knowledge-base'],
    queryFn: () => fetchProjectKnowledgeBase(projectId),
    enabled: Boolean(projectId),
  });
}

function invalidateProjectQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['projects'] });
  void queryClient.invalidateQueries({ queryKey: ['projects', 'dashboard'] });
  if (projectId) {
    void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['project', projectId, 'dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['project', projectId, 'kanban'] });
    void queryClient.invalidateQueries({ queryKey: ['project', projectId, 'members'] });
  }
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createProject,
    errorToast: false,
    successMessage: false,
    onSuccess: () => invalidateProjectQueries(queryClient),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateProject(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: archiveProject,
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, id) => invalidateProjectQueries(queryClient, id),
  });
}

export function useRestoreProject() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: restoreProject,
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, id) => invalidateProjectQueries(queryClient, id),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteProject,
    errorToast: false,
    successMessage: false,
    onSuccess: () => invalidateProjectQueries(queryClient),
  });
}

export function useAssignProjectMember() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: assignProjectMember,
    successMessage: false,
    errorToast: false,
    onSuccess: (_data, variables) => {
      const projectId = String(variables.projectId ?? '');
      invalidateProjectQueries(queryClient, projectId);
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ memberId }: { memberId: string; projectId: string }) =>
      removeProjectMember(memberId),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, variables.projectId);
    },
  });
}

export function useCreateProjectModule() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createProjectModule,
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, String(variables.projectId));
    },
  });
}

export function useDeleteProjectModule() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ moduleId }: { moduleId: string; projectId: string }) =>
      deleteProjectModule(moduleId),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, variables.projectId);
    },
  });
}

export function useCreateProjectMilestone() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createProjectMilestone,
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, String(variables.projectId));
    },
  });
}

export function useDeleteProjectMilestone() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ milestoneId }: { milestoneId: string; projectId: string }) =>
      deleteProjectMilestone(milestoneId),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, variables.projectId);
    },
  });
}

export function useCreateProjectSprint() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createProjectSprint,
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, String(variables.projectId));
    },
  });
}

export function useUpdateProjectSprint() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({
      sprintId,
      payload,
    }: {
      sprintId: string;
      payload: Record<string, unknown>;
      projectId: string;
    }) => updateProjectSprint(sprintId, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, variables.projectId);
    },
  });
}

export function useUpsertProjectKnowledgeBase() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectKnowledgeBase }) =>
      upsertProjectKnowledgeBase(projectId, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, variables.projectId);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createTask,
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const projectId = typeof variables.projectId === 'string' ? variables.projectId : undefined;
      invalidateProjectQueries(queryClient, projectId);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateTask(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      const projectId =
        typeof variables.payload.projectId === 'string' ? variables.payload.projectId : undefined;
      invalidateProjectQueries(queryClient, projectId);
    },
  });
}

export function useTaskVerifications(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId, 'verifications'],
    queryFn: () => fetchTaskVerifications(taskId),
    enabled: Boolean(taskId),
  });
}

export function useApproveTaskVerification() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ verificationId, comment }: { verificationId: string; comment?: string }) =>
      approveTaskVerification(verificationId, comment),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useRejectTaskVerification() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({
      verificationId,
      comment,
      revisionNotes,
    }: {
      verificationId: string;
      comment: string;
      revisionNotes?: string;
    }) => rejectTaskVerification(verificationId, comment, revisionNotes),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}
