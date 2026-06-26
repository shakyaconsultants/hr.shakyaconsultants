import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';
import { asRecord } from '@/shared/utils/api-normalize.util';

const PROJECT_PREFIX = '/api/v1/projects';

export interface ProjectRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  priority: string;
  startDate: string;
  targetDate?: string;
  projectManagerId: string;
  clientName?: string;
  isArchived: boolean;
  logoUrl?: string;
  tags: string[];
}

export interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType: string;
  assigneeId?: string;
  reporterId: string;
  verifierId?: string;
  dueDate?: string;
  storyPoints?: number;
  progressPercent: number;
  sprintId?: string;
  moduleId?: string;
  milestoneId?: string;
}

export interface ManagerDashboard {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  pendingVerifications: number;
  activeSprints: number;
  upcomingDeadlines: { id: string; title: string; dueDate: string; projectId: string }[];
  recentActivity: { id: string; activityType: string; description: string; createdAt: string }[];
  tasksByStatus: Record<string, number>;
}

export interface ListProjectsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  includeArchived?: boolean;
  scope?: 'all' | 'assigned';
}

export interface EnterpriseDashboard extends ManagerDashboard {
  projectsAtRisk: number;
  budgetSummary: { totalBudget: number; currency: string; projectCount: number };
  resourceAllocation: { employeeId: string; projectCount: number; totalAllocation: number }[];
  projectHealth: { healthy: number; atRisk: number; critical: number };
  recentProjects: { id: string; name: string; code: string; status: string; riskLevel: string; targetDate?: string }[];
  teamWorkload?: { employeeId: string; taskCount: number; allocationPercent: number }[];
}

export interface ProjectWizardDraftResponse {
  id?: string;
  currentStep: string;
  payload: Record<string, unknown>;
  updatedAt?: string;
}

export interface ListTasksParams {
  page?: number;
  pageSize?: number;
  search?: string;
  projectId?: string;
  sprintId?: string;
  status?: string;
  assigneeId?: string;
}

export async function fetchManagerDashboard(): Promise<ManagerDashboard> {
  const { data } = await apiClient.get<ApiSuccessResponse<ManagerDashboard>>(`${PROJECT_PREFIX}/dashboard/manager`);
  return data.data;
}

export async function fetchEnterpriseDashboard(): Promise<EnterpriseDashboard> {
  const { data } = await apiClient.get<ApiSuccessResponse<EnterpriseDashboard>>(`${PROJECT_PREFIX}/dashboard/enterprise`);
  return data.data;
}

export async function fetchDeveloperDashboard(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(`${PROJECT_PREFIX}/dashboard/developer`);
  return data.data;
}

export async function fetchProjects(params: ListProjectsParams = {}): Promise<PaginatedResult<ProjectRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProjectRecord[]> & { pagination?: PaginationMeta }>(
    PROJECT_PREFIX,
    { params },
  );
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 },
  };
}

export async function fetchProject(id: string): Promise<ProjectRecord> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProjectRecord>>(`${PROJECT_PREFIX}/${id}`);
  return data.data;
}

export async function createProject(payload: Record<string, unknown>): Promise<ProjectRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(PROJECT_PREFIX, payload);
  return data.data;
}

export async function updateProject(id: string, payload: Record<string, unknown>): Promise<ProjectRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<ProjectRecord>>(`${PROJECT_PREFIX}/${id}`, payload);
  return data.data;
}

export async function archiveProject(id: string): Promise<ProjectRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(`${PROJECT_PREFIX}/${id}/archive`);
  return data.data;
}

export async function restoreProject(id: string): Promise<ProjectRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(`${PROJECT_PREFIX}/${id}/restore`);
  return data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`${PROJECT_PREFIX}/${id}`);
}

export async function assignProjectMember(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(`${PROJECT_PREFIX}/members`, payload);
  return data.data;
}

export async function removeProjectMember(memberId: string): Promise<void> {
  await apiClient.delete(`${PROJECT_PREFIX}/members/${memberId}`);
}

export async function fetchProjectModules(projectId: string): Promise<Record<string, unknown>[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>[]>>(`${PROJECT_PREFIX}/${projectId}/modules`);
  return data.data;
}

export async function createProjectModule(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(`${PROJECT_PREFIX}/modules`, payload);
  return data.data;
}

export async function deleteProjectModule(moduleId: string): Promise<void> {
  await apiClient.delete(`${PROJECT_PREFIX}/modules/${moduleId}`);
}

export async function fetchProjectMilestones(projectId: string): Promise<Record<string, unknown>[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>[]>>(`${PROJECT_PREFIX}/${projectId}/milestones`);
  return data.data;
}

export async function createProjectMilestone(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(`${PROJECT_PREFIX}/milestones`, payload);
  return data.data;
}

export async function deleteProjectMilestone(milestoneId: string): Promise<void> {
  await apiClient.delete(`${PROJECT_PREFIX}/milestones/${milestoneId}`);
}

export async function createProjectSprint(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(`${PROJECT_PREFIX}/sprints`, payload);
  return data.data;
}

export async function updateProjectSprint(sprintId: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Record<string, unknown>>>(`${PROJECT_PREFIX}/sprints/${sprintId}`, payload);
  return data.data;
}

export interface ProjectKnowledgeBase {
  repositoryUrl?: string;
  branches?: string[];
  apiDocsUrl?: string;
  swaggerUrl?: string;
  envVariables?: string;
  deploymentGuide?: string;
  architectureNotes?: string;
  documentUrls?: string[];
}

export async function fetchProjectKnowledgeBase(projectId: string): Promise<ProjectKnowledgeBase | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProjectKnowledgeBase | null>>(`${PROJECT_PREFIX}/${projectId}/knowledge-base`);
  return data.data;
}

export async function upsertProjectKnowledgeBase(
  projectId: string,
  payload: ProjectKnowledgeBase,
): Promise<ProjectKnowledgeBase> {
  const { data } = await apiClient.put<ApiSuccessResponse<ProjectKnowledgeBase>>(
    `${PROJECT_PREFIX}/${projectId}/knowledge-base`,
    payload,
  );
  return data.data;
}

export async function fetchTasks(params: ListTasksParams = {}): Promise<PaginatedResult<TaskRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponse<TaskRecord[]> & { pagination?: PaginationMeta }>(
    `${PROJECT_PREFIX}/tasks/list`,
    { params },
  );
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 },
  };
}

export async function fetchProjectKanban(projectId: string): Promise<{ columns: Record<string, TaskRecord[]>; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ columns: Record<string, TaskRecord[]>; total: number }>>(
    `${PROJECT_PREFIX}/${projectId}/kanban`,
  );
  return {
    columns: asRecord(data.data?.columns),
    total: data.data?.total ?? 0,
  };
}

export async function fetchProjectMembers(projectId: string): Promise<Record<string, unknown>[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>[]>>(`${PROJECT_PREFIX}/${projectId}/members`);
  return data.data;
}

export async function fetchProjectSprints(projectId: string): Promise<Record<string, unknown>[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>[]>>(`${PROJECT_PREFIX}/${projectId}/sprints`);
  return data.data;
}

export async function createTask(payload: Record<string, unknown>): Promise<TaskRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<TaskRecord>>(`${PROJECT_PREFIX}/tasks`, payload);
  return data.data;
}

export async function updateTask(id: string, payload: Record<string, unknown>): Promise<TaskRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<TaskRecord>>(`${PROJECT_PREFIX}/tasks/${id}`, payload);
  return data.data;
}

export async function fetchTask(id: string): Promise<TaskRecord> {
  const { data } = await apiClient.get<ApiSuccessResponse<TaskRecord>>(`${PROJECT_PREFIX}/tasks/${id}`);
  return data.data;
}

export async function fetchProjectDashboard(projectId: string): Promise<ManagerDashboard> {
  const { data } = await apiClient.get<ApiSuccessResponse<ManagerDashboard>>(`${PROJECT_PREFIX}/dashboard/${projectId}`);
  return data.data;
}

export async function fetchWizardDraft(): Promise<ProjectWizardDraftResponse | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProjectWizardDraftResponse | null>>(`${PROJECT_PREFIX}/wizard/draft`);
  return data.data;
}

export async function saveWizardDraft(payload: { currentStep: string; payload: Record<string, unknown> }): Promise<ProjectWizardDraftResponse> {
  const { data } = await apiClient.put<ApiSuccessResponse<ProjectWizardDraftResponse>>(`${PROJECT_PREFIX}/wizard/draft`, payload);
  return data.data;
}

export async function deleteWizardDraft(): Promise<void> {
  await apiClient.delete(`${PROJECT_PREFIX}/wizard/draft`);
}

export async function finalizeProjectWizard(payload: Record<string, unknown>): Promise<ProjectRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<ProjectRecord>>(`${PROJECT_PREFIX}/wizard/finalize`, payload);
  return data.data;
}

export async function fetchMemberHistory(projectId: string): Promise<Record<string, unknown>[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>[]>>(`${PROJECT_PREFIX}/${projectId}/members/history`);
  return data.data;
}
