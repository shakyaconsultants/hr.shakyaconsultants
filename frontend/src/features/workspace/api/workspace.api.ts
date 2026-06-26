import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

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
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(`${WORKSPACE_PREFIX}/widgets/${slug}`);
  return data.data;
}

export async function updateWidgetConfig(widgets: Partial<WidgetConfig>[]): Promise<{ widgets: WidgetConfig[] }> {
  const { data } = await apiClient.put<ApiSuccessResponse<{ widgets: WidgetConfig[] }>>(`${WORKSPACE_PREFIX}/widgets/config`, { widgets });
  return data.data;
}

export async function fetchProfile(): Promise<WorkspaceProfile> {
  const { data } = await apiClient.get<ApiSuccessResponse<WorkspaceProfile>>(`${WORKSPACE_PREFIX}/profile`);
  return data.data;
}

export async function updateProfile(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Record<string, unknown>>>(`${WORKSPACE_PREFIX}/profile`, payload);
  return data.data;
}

export async function fetchHierarchy(): Promise<OrgChart> {
  const { data } = await apiClient.get<ApiSuccessResponse<OrgChart>>(`${WORKSPACE_PREFIX}/hierarchy`);
  return data.data;
}

export async function fetchMyProjects(params: ListParams = {}): Promise<{ items: MyProjectItem[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyProjectItem[]> & { pagination?: PaginationMeta }>(`${WORKSPACE_PREFIX}/projects`, { params });
  return { items: data.data, total: data.pagination?.total ?? data.data.length };
}

export async function fetchMyTasks(params: ListParams & { status?: string; projectId?: string } = {}): Promise<PaginatedResult<TaskRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponse<TaskRecord[]> & { pagination?: PaginationMeta }>(`${WORKSPACE_PREFIX}/tasks`, { params });
  return { items: data.data, pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 } };
}

export async function fetchMyTasksKanban(projectId?: string): Promise<{ columns: Record<string, TaskRecord[]>; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ columns: Record<string, TaskRecord[]>; total: number }>>(`${WORKSPACE_PREFIX}/tasks/kanban`, { params: { projectId } });
  return data.data;
}

export async function bulkUpdateTaskStatus(taskIds: string[], status: string): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ count: number }>>(`${WORKSPACE_PREFIX}/tasks/bulk-status`, { taskIds, status });
  return data.data;
}

export async function quickUpdateTask(id: string, payload: { status?: string; progressPercent?: number }): Promise<TaskRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<TaskRecord>>(`${WORKSPACE_PREFIX}/tasks/${id}`, payload);
  return data.data;
}

export async function fetchDocuments(params: ListParams = {}): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>[]>>(`${WORKSPACE_PREFIX}/documents`, { params });
  return { items: data.data, total: data.data.length };
}

export async function downloadDocument(id: string): Promise<{ fileUrl: string; fileName: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ fileUrl: string; fileName: string }>>(`${WORKSPACE_PREFIX}/documents/${id}/download`);
  return data.data;
}

export async function fetchAnnouncements(params: ListParams = {}): Promise<{ items: AnnouncementRecord[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<AnnouncementRecord[]>>(`${WORKSPACE_PREFIX}/announcements`, { params });
  return { items: data.data, total: data.data.length };
}

export async function acknowledgeAnnouncement(id: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(`${WORKSPACE_PREFIX}/announcements/${id}/acknowledge`);
  return data.data;
}

export async function fetchNotifications(params: ListParams & { isRead?: boolean; isArchived?: boolean } = {}): Promise<PaginatedResult<NotificationRecord> & { grouped?: Record<string, NotificationRecord[]> }> {
  const { data } = await apiClient.get<ApiSuccessResponse<NotificationRecord[]> & { grouped?: Record<string, NotificationRecord[]>; pagination?: PaginationMeta }>(`${WORKSPACE_PREFIX}/notifications`, { params });
  return { items: data.data, grouped: data.grouped, pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 } };
}

export async function markNotificationRead(id: string): Promise<NotificationRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<NotificationRecord>>(`${WORKSPACE_PREFIX}/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ count: number }>>(`${WORKSPACE_PREFIX}/notifications/mark-all-read`);
  return data.data;
}

export async function archiveNotification(id: string): Promise<NotificationRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<NotificationRecord>>(`${WORKSPACE_PREFIX}/notifications/${id}/archive`);
  return data.data;
}

export async function fetchActivity(params: ListParams = {}): Promise<{ items: TimelineItem[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ items: TimelineItem[]; total: number }>>(
    `${WORKSPACE_PREFIX}/activity`,
    { params },
  );
  return data.data;
}

export async function fetchCalendar(startDate: string, endDate: string): Promise<{ events: CalendarEvent[] }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ events: CalendarEvent[] }>>(`${WORKSPACE_PREFIX}/calendar`, { params: { startDate, endDate } });
  return data.data;
}

export async function workspaceSearch(q: string, types?: string[]): Promise<{ results: SearchResult[]; total: number }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ results: SearchResult[]; total: number }>>(`${WORKSPACE_PREFIX}/search`, { params: { q, types: types?.join(',') } });
  return data.data;
}
