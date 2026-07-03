import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  acknowledgeAnnouncement,
  archiveNotification,
  bulkUpdateTaskStatus,
  downloadDocument,
  fetchAnnouncements,
  fetchCalendar,
  fetchDocuments,
  fetchHierarchy,
  fetchMyProjects,
  fetchMyProject,
  fetchMyTasks,
  fetchMyTasksKanban,
  fetchNotifications,
  fetchProfile,
  fetchWidgetData,
  fetchOnboardingStatus,
  fetchWorkspaceLayout,
  markAllNotificationsRead,
  markNotificationRead,
  quickUpdateTask,
  submitTaskForVerification,
  requestOnboardingPortalLink,
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
  project: (id: string) => ['workspace', 'project', id] as const,
  projects: (params: ListParams) => ['workspace', 'projects', params] as const,
  tasks: (params: ListParams & { status?: string; projectId?: string }) => ['workspace', 'tasks', params] as const,
  kanban: (projectId?: string) => ['workspace', 'tasks', 'kanban', projectId] as const,
  documents: (params: ListParams) => ['workspace', 'documents', params] as const,
  announcements: (params: ListParams) => ['workspace', 'announcements', params] as const,
  notifications: (params: ListParams & { isRead?: boolean }) => ['workspace', 'notifications', params] as const,
  onboarding: ['workspace', 'onboarding', 'status'] as const,
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
  return useAppMutation({
    mutationFn: updateWidgetConfig,
    errorToast: false,
    successMessage: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.layout }),
  });
}

export function useWorkspaceProfile() {
  return useQuery({ queryKey: KEYS.profile, queryFn: fetchProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: updateProfile,
    errorToast: false,
    successMessage: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.profile }),
  });
}

export function useOrgChart() {
  return useQuery({ queryKey: KEYS.hierarchy, queryFn: fetchHierarchy });
}

export function useMyProjects(params: ListParams = {}) {
  return useQuery({ queryKey: KEYS.projects(params), queryFn: () => fetchMyProjects(params) });
}

export function useMyProject(id: string) {
  return useQuery({
    queryKey: KEYS.project(id),
    queryFn: () => fetchMyProject(id),
    enabled: Boolean(id),
  });
}

export function useMyTasks(params: ListParams & { status?: string; projectId?: string } = {}) {
  return useQuery({ queryKey: KEYS.tasks(params), queryFn: () => fetchMyTasks(params) });
}

export function useMyTasksKanban(projectId?: string) {
  return useQuery({ queryKey: KEYS.kanban(projectId), queryFn: () => fetchMyTasksKanban(projectId) });
}

export function useBulkUpdateTasks() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: ({ taskIds, status }: { taskIds: string[]; status: string }) => bulkUpdateTaskStatus(taskIds, status),
    successMessage: 'Updated successfully',
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
      qc.invalidateQueries({ queryKey: ['workspace', 'widget'] });
    },
  });
}

export function useSubmitTaskForVerification() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: submitTaskForVerification,
    successMessage: 'Task submitted for verification',
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'tasks'] });
      qc.invalidateQueries({ queryKey: ['workspace', 'project'] });
      qc.invalidateQueries({ queryKey: ['workspace', 'widget'] });
    },
  });
}

export function useQuickUpdateTask() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; progressPercent?: number } }) => quickUpdateTask(id, payload),
    successMessage: 'Updated successfully',
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
  return useAppMutation({
    mutationFn: downloadDocument,
    successMessage: 'Downloaded successfully',
  });
}

export function useAnnouncements(params: ListParams = {}) {
  return useQuery({ queryKey: KEYS.announcements(params), queryFn: () => fetchAnnouncements(params) });
}

export function useAcknowledgeAnnouncement() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: acknowledgeAnnouncement,
    successMessage: 'Acknowledged successfully',
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'announcements'] }),
  });
}

export function useNotifications(params: ListParams & { isRead?: boolean; isArchived?: boolean } = {}) {
  return useQuery({ queryKey: KEYS.notifications(params), queryFn: () => fetchNotifications(params) });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: markNotificationRead,
    successMessage: 'Marked as read',
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: markAllNotificationsRead,
    successMessage: 'Marked as read',
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'notifications'] }),
  });
}

export function useArchiveNotification() {
  const qc = useQueryClient();
  return useAppMutation({
    mutationFn: archiveNotification,
    successMessage: 'Archived successfully',
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace', 'notifications'] }),
  });
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

export function useOnboardingStatus() {
  return useQuery({
    queryKey: KEYS.onboarding,
    queryFn: fetchOnboardingStatus,
  });
}

export function useRequestOnboardingPortalLink() {
  return useAppMutation({
    mutationFn: requestOnboardingPortalLink,
  });
}
