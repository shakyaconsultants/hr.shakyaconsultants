import apiClient from '@/shared/api/axios.client';
import type { ProjectKnowledgeBase, ProjectMemberRecord } from '@/features/project/api/project.api';
import type {
  ApiSuccessResponse,
  ApiSuccessResponseWithPagination,
  PaginatedResult,
} from '@/shared/types/api.types';
import { unwrapApiPaginated } from '@/shared/utils/api-normalize.util';

const WORKSPACE_PREFIX = '/api/v1/workspace';

export interface WidgetCatalogEntry {
  slug: string;
  name: string;
  description: string;
  defaultSortOrder: number;
  defaultColumnSpan: number;
  isPlaceholder?: boolean;
}

export interface WidgetConfig {
  id: string;
  widgetSlug: string;
  sortOrder: number;
  isVisible: boolean;
  columnSpan: number;
  config: Record<string, unknown>;
}

export interface WorkspaceLayout {
  catalog: WidgetCatalogEntry[];
  widgets: WidgetConfig[];
}

export interface WorkspaceProfile {
  employee: Record<string, unknown>;
  emergencyContacts: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  education: Record<string, unknown>[];
  experience: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  timeline: Record<string, unknown>[];
  managers: Record<string, unknown>[];
  permissions: string[];
  roleIds: string[];
  sessions: Record<string, unknown>[];
}

export interface OrgChart {
  self: { id: string; firstName: string; lastName: string; email: string; photoUrl?: string };
  department: Record<string, unknown> | null;
  branch: Record<string, unknown> | null;
  managers: { id: string; firstName: string; lastName: string }[];
  directReports: { id: string; firstName: string; lastName: string }[];
  peers: { id: string; firstName: string; lastName: string }[];
}

export interface MyProjectItem {
  project: Record<string, unknown>;
  role?: string;
  progress: number;
  totalTasks: number;
  myTaskCount?: number;
  completedTasks: number;
  upcomingDeadlines: Record<string, unknown>[];
  milestones: Record<string, unknown>[];
  sprints: Record<string, unknown>[];
}

export interface TaskRecord {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId: string;
  progressPercent?: number;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  readAt?: string;
  category?: string;
  deepLink?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  isEmergency?: boolean;
  isRead?: boolean;
  isAcknowledged?: boolean;
  publishedAt?: string;
}

export interface TimelineItem {
  id: string;
  type: string;
  activityType: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  type: string;
  title: string;
  date: string;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function fetchWorkspaceLayout(): Promise<WorkspaceLayout> {
  const { data } = await apiClient.get<ApiSuccessResponse<WorkspaceLayout>>(WORKSPACE_PREFIX);
  return data.data;
}

export async function fetchWidgetData(slug: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${WORKSPACE_PREFIX}/widgets/${slug}`,
  );
  return data.data;
}

export async function updateWidgetConfig(
  widgets: Partial<WidgetConfig>[],
): Promise<{ widgets: WidgetConfig[] }> {
  const { data } = await apiClient.put<ApiSuccessResponse<{ widgets: WidgetConfig[] }>>(
    `${WORKSPACE_PREFIX}/widgets/config`,
    { widgets },
  );
  return data.data;
}

export async function fetchProfile(): Promise<WorkspaceProfile> {
  const { data } = await apiClient.get<ApiSuccessResponse<WorkspaceProfile>>(
    `${WORKSPACE_PREFIX}/profile`,
  );
  return data.data;
}

export async function updateProfile(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Record<string, unknown>>>(
    `${WORKSPACE_PREFIX}/profile`,
    payload,
  );
  return data.data;
}

export async function fetchHierarchy(): Promise<OrgChart> {
  const { data } = await apiClient.get<ApiSuccessResponse<OrgChart>>(
    `${WORKSPACE_PREFIX}/hierarchy`,
  );
  return data.data;
}

export async function fetchMyProjects(
  params: ListParams = {},
): Promise<{ items: MyProjectItem[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponseWithPagination<MyProjectItem>>(
    `${WORKSPACE_PREFIX}/projects`,
    { params },
  );
  const normalized = unwrapApiPaginated<MyProjectItem>(data, params.pageSize ?? 20);
  return { items: normalized.items, total: normalized.pagination.total };
}

export interface MyProjectDetail {
  project: Record<string, unknown>;
  role: string;
  canManage: boolean;
  canViewEnv: boolean;
  myTasks: TaskRecord[];
  milestones: Record<string, unknown>[];
  sprints: Record<string, unknown>[];
  members: ProjectMemberRecord[];
  knowledgeBase: ProjectKnowledgeBase | null;
}

export async function fetchMyProject(id: string): Promise<MyProjectDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyProjectDetail>>(
    `${WORKSPACE_PREFIX}/projects/${id}`,
  );
  return data.data;
}

export async function fetchMyTasks(
  params: ListParams & { status?: string; projectId?: string } = {},
): Promise<PaginatedResult<TaskRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponseWithPagination<TaskRecord>>(
    `${WORKSPACE_PREFIX}/tasks`,
    { params },
  );
  return unwrapApiPaginated<TaskRecord>(data, params.pageSize ?? 20);
}

export async function fetchMyTasksKanban(
  projectId?: string,
): Promise<{ columns: Record<string, TaskRecord[]>; total: number }> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ columns: Record<string, TaskRecord[]>; total: number }>
  >(`${WORKSPACE_PREFIX}/tasks/kanban`, { params: { projectId } });
  return data.data;
}

export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: string,
): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ count: number }>>(
    `${WORKSPACE_PREFIX}/tasks/bulk-status`,
    { taskIds, status },
  );
  return data.data;
}

export async function quickUpdateTask(
  id: string,
  payload: { status?: string; progressPercent?: number },
): Promise<TaskRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<TaskRecord>>(
    `${WORKSPACE_PREFIX}/tasks/${id}`,
    payload,
  );
  return data.data;
}

export async function submitTaskForVerification(id: string): Promise<TaskRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<TaskRecord>>(
    `${WORKSPACE_PREFIX}/tasks/${id}/submit-verification`,
  );
  return data.data;
}

export async function fetchDocuments(
  params: ListParams = {},
): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponseWithPagination<Record<string, unknown>>>(
    `${WORKSPACE_PREFIX}/documents`,
    { params },
  );
  const normalized = unwrapApiPaginated<Record<string, unknown>>(data, params.pageSize ?? 20);
  return { items: normalized.items, total: normalized.pagination.total };
}

export async function downloadDocument(id: string): Promise<{ fileUrl: string; fileName: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ fileUrl: string; fileName: string }>>(
    `${WORKSPACE_PREFIX}/documents/${id}/download`,
  );
  return data.data;
}

export async function fetchAnnouncements(
  params: ListParams = {},
): Promise<{ items: AnnouncementRecord[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponseWithPagination<AnnouncementRecord>>(
    `${WORKSPACE_PREFIX}/announcements`,
    { params },
  );
  const normalized = unwrapApiPaginated<AnnouncementRecord>(data, params.pageSize ?? 20);
  return { items: normalized.items, total: normalized.pagination.total };
}

export async function acknowledgeAnnouncement(id: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${WORKSPACE_PREFIX}/announcements/${id}/acknowledge`,
  );
  return data.data;
}

export async function fetchNotifications(
  params: ListParams & { isRead?: boolean; isArchived?: boolean } = {},
): Promise<
  PaginatedResult<NotificationRecord> & { grouped?: Record<string, NotificationRecord[]> }
> {
  const { data } = await apiClient.get<
    ApiSuccessResponseWithPagination<NotificationRecord> & {
      data?: NotificationRecord[] & { grouped?: Record<string, NotificationRecord[]> };
    }
  >(`${WORKSPACE_PREFIX}/notifications`, { params });
  const normalized = unwrapApiPaginated<NotificationRecord>(data, params.pageSize ?? 20);
  const grouped =
    (data.data as NotificationRecord[] & { grouped?: Record<string, NotificationRecord[]> })
      ?.grouped ?? {};
  return {
    items: normalized.items,
    pagination: normalized.pagination,
    grouped,
  };
}

export async function markNotificationRead(id: string): Promise<NotificationRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<NotificationRecord>>(
    `${WORKSPACE_PREFIX}/notifications/${id}/read`,
  );
  return data.data;
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ count: number }>>(
    `${WORKSPACE_PREFIX}/notifications/mark-all-read`,
  );
  return data.data;
}

export async function archiveNotification(id: string): Promise<NotificationRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<NotificationRecord>>(
    `${WORKSPACE_PREFIX}/notifications/${id}/archive`,
  );
  return data.data;
}

export async function fetchCalendar(
  startDate: string,
  endDate: string,
): Promise<{ events: CalendarEvent[] }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ events: CalendarEvent[] }>>(
    `${WORKSPACE_PREFIX}/calendar`,
    { params: { startDate, endDate } },
  );
  return data.data;
}

export async function workspaceSearch(
  q: string,
  types?: string[],
): Promise<{ results: SearchResult[]; total: number }> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ results: SearchResult[]; total: number }>
  >(`${WORKSPACE_PREFIX}/search`, { params: { q, types: types?.join(',') } });
  return data.data;
}

export interface WorkspaceOnboardingStatus {
  required: boolean;
  status: string;
  progressPercent: number;
  completedSections: string[];
  currentSection: string | null;
}

export async function fetchOnboardingStatus(): Promise<WorkspaceOnboardingStatus> {
  const { data } = await apiClient.get<ApiSuccessResponse<WorkspaceOnboardingStatus>>(
    `${WORKSPACE_PREFIX}/onboarding/status`,
  );
  return data.data;
}

export async function requestOnboardingPortalLink(): Promise<{
  portalUrl: string;
  expiresAt: string;
}> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ portalUrl: string; expiresAt: string }>
  >(`${WORKSPACE_PREFIX}/onboarding/portal-link`);
  return data.data;
}
