import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  acknowledgeAnnouncement,
  archiveCommunicationNotification,
  createAnnouncement,
  createChannel,
  createDirectConversation,
  deleteAnnouncement,
  deleteChannel,
  deleteMessage,
  exportCommunicationReport,
  fetchAnnouncement,
  fetchAnnouncementHistory,
  fetchAnnouncements,
  fetchAnnouncementStats,
  fetchChannel,
  fetchChannelMembers,
  fetchChannels,
  fetchCommunicationNotifications,
  fetchCommunicationPolicies,
  fetchCommunicationReport,
  fetchCommunicationSettings,
  fetchDirectConversations,
  fetchEnterpriseDashboard,
  fetchInbox,
  fetchManagerDashboard,
  fetchMessages,
  fetchWorkspaceDashboard,
  forwardMessage,
  markAllCommunicationNotificationsRead,
  markCommunicationNotificationRead,
  markMessageRead,
  publishAnnouncement,
  searchCommunication,
  sendMessage,
  starMessage,
  updateAnnouncement,
  updateChannel,
  updateCommunicationPolicies,
  updateCommunicationSettings,
  updateMessage,
  type AnnouncementListParams,
  type ChannelListParams,
  type CreateAnnouncementPayload,
  type CreateChannelPayload,
  type DashboardQuery,
  type ListParams,
  type NotificationListParams,
  type ReportParams,
  type SearchParams,
  type SendMessagePayload,
  type UpdateAnnouncementPayload,
  type UpdateChannelPayload,
} from '@/features/communication/api/communication.api';

export function useEnterpriseCommunicationDashboard(params: DashboardQuery = {}) {
  return useQuery({
    queryKey: ['communication', 'dashboard', 'enterprise', params],
    queryFn: () => fetchEnterpriseDashboard(params),
  });
}

export function useManagerCommunicationDashboard(params: DashboardQuery = {}) {
  return useQuery({
    queryKey: ['communication', 'dashboard', 'manager', params],
    queryFn: () => fetchManagerDashboard(params),
  });
}

export function useWorkspaceCommunicationDashboard(params: DashboardQuery = {}) {
  return useQuery({
    queryKey: ['communication', 'dashboard', 'workspace', params],
    queryFn: () => fetchWorkspaceDashboard(params),
  });
}

export function useCommunicationPolicies() {
  return useQuery({
    queryKey: ['communication', 'policies'],
    queryFn: fetchCommunicationPolicies,
  });
}

export function useUpdateCommunicationPolicies() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: updateCommunicationPolicies,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'policies'] }),
  });
}

export function useCommunicationSettings() {
  return useQuery({
    queryKey: ['communication', 'settings'],
    queryFn: fetchCommunicationSettings,
  });
}

export function useUpdateCommunicationSettings() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: updateCommunicationSettings,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'settings'] }),
  });
}

export function useAnnouncements(params: AnnouncementListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'announcements', params],
    queryFn: () => fetchAnnouncements(params),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['communication', 'announcement', id],
    queryFn: () => fetchAnnouncement(id),
    enabled: Boolean(id),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => createAnnouncement(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAnnouncementPayload }) =>
      updateAnnouncement(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => publishAnnouncement(id),
    successMessage: 'Published successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function useAnnouncementStats(id: string) {
  return useQuery({
    queryKey: ['communication', 'announcement', id, 'stats'],
    queryFn: () => fetchAnnouncementStats(id),
    enabled: Boolean(id),
  });
}

export function useAnnouncementHistory(params: AnnouncementListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'announcements', 'history', params],
    queryFn: () => fetchAnnouncementHistory(params),
  });
}

export function useAcknowledgeAnnouncement() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => acknowledgeAnnouncement(id),
    successMessage: 'Acknowledged successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function useChannels(params: ChannelListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'channels', params],
    queryFn: () => fetchChannels(params),
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['communication', 'channel', id],
    queryFn: () => fetchChannel(id),
    enabled: Boolean(id),
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateChannelPayload) => createChannel(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChannelPayload }) => updateChannel(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] }),
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteChannel(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] }),
  });
}

export function useChannelMembers(id: string) {
  return useQuery({
    queryKey: ['communication', 'channel', id, 'members'],
    queryFn: () => fetchChannelMembers(id),
    enabled: Boolean(id),
  });
}

export function useDirectConversations(params: ListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'conversations', 'direct', params],
    queryFn: () => fetchDirectConversations(params),
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (targetEmployeeId: string) => createDirectConversation(targetEmployeeId),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] }),
  });
}

export function useMessages(conversationId: string, params: ListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'messages', conversationId, params],
    queryFn: () => fetchMessages(conversationId, params),
    enabled: Boolean(conversationId),
    refetchInterval: conversationId ? 10_000 : false,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: string; payload: SendMessagePayload }) =>
      sendMessage(conversationId, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['communication', 'messages', variables.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateMessage(id, content),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteMessage(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useForwardMessage() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, targetConversationId }: { id: string; targetConversationId: string }) =>
      forwardMessage(id, targetConversationId),
    successMessage: 'Forwarded successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useStarMessage() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => starMessage(id),
    successMessage: 'Updated successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => markMessageRead(id),
    successMessage: 'Marked as read',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useCommunicationNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'notifications', params],
    queryFn: () => fetchCommunicationNotifications(params),
  });
}

export function useMarkCommunicationNotificationRead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => markCommunicationNotificationRead(id),
    successMessage: 'Marked as read',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] }),
  });
}

export function useMarkAllCommunicationNotificationsRead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: markAllCommunicationNotificationsRead,
    successMessage: 'Marked as read',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] }),
  });
}

export function useArchiveCommunicationNotification() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => archiveCommunicationNotification(id),
    successMessage: 'Archived successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] }),
  });
}

export function useInbox(params: ListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'inbox', params],
    queryFn: () => fetchInbox(params),
  });
}

export function useCommunicationSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['communication', 'search', params],
    queryFn: () => searchCommunication(params),
    enabled: enabled && Boolean(params.q.trim()),
  });
}

export function useCommunicationReport(params: ReportParams) {
  return useQuery({
    queryKey: ['communication', 'reports', params],
    queryFn: () => fetchCommunicationReport(params),
  });
}

export function useExportCommunicationReport() {
  return useAppMutation({
    mutationFn: (params: ReportParams) => exportCommunicationReport(params),
    successMessage: 'Export started successfully',
  });
}
