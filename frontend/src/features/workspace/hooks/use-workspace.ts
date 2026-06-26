import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acknowledgeAnnouncement,
  archiveNotification,
  bulkUpdateTaskStatus,
  downloadDocument,
  fetchActivity,
  fetchAnnouncements,
  fetchCalendar,
  fetchDocuments,
  fetchHierarchy,
  fetchMyProjects,
  fetchMyTasks,
  fetchMyTasksKanban,
  fetchNotifications,
  fetchProfile,
  fetchWidgetData,
  fetchWorkspaceLayout,
  markAllNotificationsRead,
  markNotificationRead,
  quickUpdateTask,
  updateProfile,
  updateWidgetConfig,
  workspaceSearch,
  type ListParams,
} from '@/features/workspace/api/workspace.api';

const KEYS = {
  layout: ['workspace', 'layout'] as const,
  widget: (slug: string) => ['workspace', 'widget', slug] as const,
  profile: ['workspace', 'profile'] as const,
  hierarchy: ['workspace', 'hierarchy'] as const,
  projects: (params: ListParams) => ['workspace', 'projects', params] as const,
  tasks: (params: ListParams & { status?: string }) => ['workspace', 'tasks', params] as const,
  kanban: (projectId?: string) => ['workspace', 'tasks', 'kanban', projectId] as const,
  documents: (params: ListParams) => ['workspace', 'documents', params] as const,
  announcements: (params: ListParams) => ['workspace', 'announcements', params] as const,
  notifications: (params: ListParams & { isRead?: boolean }) => ['workspace', 'notifications', params] as const,
  activity: (params: ListParams) => ['workspace', 'activity', params] as const,
  calendar: (start: string, end: string) => ['workspace', 'calendar', start, end] as const,
  search: (q: string) => ['workspace', 'search', q] as const,
};

export function useWorkspaceLayout() {
  return useQuery({ queryKey: KEYS.layout, queryFn: fetchWorkspaceLayout });
}

export function useWidgetData(slug: string, enabled = true) {
  return useQuery({
    queryKey: KEYS.widget(slug),
    queryFn: () => fetchWidgetData(slug),
    enabled: enabled && !!slug,
  });
}

export function useUpdateWidgetConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateWidgetConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.layout }),
  });
}

export function useWorkspaceProfile() {
  return useQuery({ queryKey: KEYS.profile, queryFn: fetchProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.profile }),
  });
}

export function useOrgChart() {
  return useQuery({ queryKey: KEYS.hierarchy, queryFn: fetchHierarchy });
}

export function useMyProjects(params: ListParams = {}) {
  return useQuery({ queryKey: KEYS.projects(params), queryFn: () => fetchMyProjects(params) });
}

export function useMyTasks(params: ListParams & { status?: string } = {}) {
  return useQuery({ queryKey: KEYS.tasks(params), queryFn: () => fetchMyTasks(params) });
}

export function useMyTasksKanban(projectId?: string) {
  return useQuery({ queryKey: KEYS.kanban(projectId), queryFn: () => fetchMyTasksKanban(projectId) });
}

export function useBulkUpdateTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, status }: { taskIds: string[]; status: string }) => bulkUpdateTaskStatus(taskIds, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
      qc.invalidateQueries({ queryKey: ['workspace', 'widget'] });
    },
  });
}

export function useQuickUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; progressPercent?: number } }) => quickUpdateTask(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
      qc.invalidateQueries({ queryKey: ['workspace', 'widget'] });
    },
  });
}

export function useMyDocuments(params: ListParams = {}) {
  return useQuery({ queryKey: KEYS.documents(params), queryFn: () => fetchDocuments(params) });
}

export function useDownloadDocument() {
  return useMutation({ mutationFn: downloadDocument });
}

export function useAnnouncements(params: ListParams = {}) {
  return useQuery({ queryKey: KEYS.announcements(params), queryFn: () => fetchAnnouncements(params) });
}

export function useAcknowledgeAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeAnnouncement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'announcements'] }),
  });
}

export function useNotifications(params: ListParams & { isRead?: boolean; isArchived?: boolean } = {}) {
  return useQuery({ queryKey: KEYS.notifications(params), queryFn: () => fetchNotifications(params) });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'notifications'] }),
  });
}

export function useArchiveNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'notifications'] }),
  });
}

export function useActivity(params: ListParams = {}) {
  return useQuery({ queryKey: KEYS.activity(params), queryFn: () => fetchActivity(params) });
}

export function useCalendar(startDate: string, endDate: string) {
  return useQuery({
    queryKey: KEYS.calendar(startDate, endDate),
    queryFn: () => fetchCalendar(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useWorkspaceSearch(q: string) {
  return useQuery({
    queryKey: KEYS.search(q),
    queryFn: () => workspaceSearch(q),
    enabled: q.length >= 2,
  });
}
