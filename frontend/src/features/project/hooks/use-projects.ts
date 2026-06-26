import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({ queryKey: ['projects', 'dashboard', 'manager'], queryFn: fetchManagerDashboard });
}

export function useEnterpriseDashboard() {
  return useQuery({ queryKey: ['projects', 'dashboard', 'enterprise'], queryFn: fetchEnterpriseDashboard });
}

export function useProjectWizardDraft() {
  return useQuery({ queryKey: ['projects', 'wizard', 'draft'], queryFn: fetchWizardDraft });
}

export function useSaveProjectWizardDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveWizardDraft,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'wizard', 'draft'] }),
  });
}

export function useFinalizeProjectWizard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: finalizeProjectWizard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: ['projects', 'wizard', 'draft'] });
    },
  });
}

export function useDeleteProjectWizardDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWizardDraft,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'wizard', 'draft'] }),
  });
}

export function useProjects(params: ListProjectsParams = {}) {
  return useQuery({ queryKey: ['projects', params], queryFn: () => fetchProjects(params) });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ['project', id], queryFn: () => fetchProject(id), enabled: Boolean(id) });
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

function invalidateProjectQueries(queryClient: ReturnType<typeof useQueryClient>, projectId?: string) {
  void queryClient.invalidateQueries({ queryKey: ['projects'] });
  if (projectId) {
    void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  }
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => invalidateProjectQueries(queryClient),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateProject(id, payload),
    onSuccess: (_data, variables) => invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveProject,
    onSuccess: (_data, id) => invalidateProjectQueries(queryClient, id),
  });
}

export function useRestoreProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreProject,
    onSuccess: (_data, id) => invalidateProjectQueries(queryClient, id),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => invalidateProjectQueries(queryClient),
  });
}

export function useAssignProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignProjectMember,
    onSuccess: (_data, variables) => {
      const projectId = String(variables.projectId ?? '');
      invalidateProjectQueries(queryClient, projectId);
      void queryClient.invalidateQueries({ queryKey: ['project', projectId, 'members'] });
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId }: { memberId: string; projectId: string }) => removeProjectMember(memberId),
    onSuccess: (_data, variables) => {
      invalidateProjectQueries(queryClient, variables.projectId);
      void queryClient.invalidateQueries({ queryKey: ['project', variables.projectId, 'members'] });
    },
  });
}

export function useCreateProjectModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectModule,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', String(variables.projectId), 'modules'] });
    },
  });
}

export function useDeleteProjectModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId }: { moduleId: string; projectId: string }) => deleteProjectModule(moduleId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', variables.projectId, 'modules'] });
    },
  });
}

export function useCreateProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectMilestone,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', String(variables.projectId), 'milestones'] });
    },
  });
}

export function useDeleteProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId }: { milestoneId: string; projectId: string }) => deleteProjectMilestone(milestoneId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', variables.projectId, 'milestones'] });
    },
  });
}

export function useCreateProjectSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectSprint,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', String(variables.projectId), 'sprints'] });
    },
  });
}

export function useUpdateProjectSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: string; payload: Record<string, unknown>; projectId: string }) =>
      updateProjectSprint(sprintId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', variables.projectId, 'sprints'] });
    },
  });
}

export function useUpsertProjectKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectKnowledgeBase }) =>
      upsertProjectKnowledgeBase(projectId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['project', variables.projectId, 'knowledge-base'] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateTask(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      void queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
