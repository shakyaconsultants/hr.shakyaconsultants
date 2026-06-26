import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: updateCommunicationPolicies,
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
  return useMutation({
    mutationFn: updateCommunicationSettings,
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
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => createAnnouncement(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAnnouncementPayload }) =>
      updateAnnouncement(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'announcements'] }),
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishAnnouncement(id),
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
  return useMutation({
    mutationFn: (id: string) => acknowledgeAnnouncement(id),
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
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => createChannel(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateChannelPayload }) => updateChannel(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] }),
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChannel(id),
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
  return useMutation({
    mutationFn: (targetEmployeeId: string) => createDirectConversation(targetEmployeeId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] }),
  });
}

export function useMessages(conversationId: string, params: ListParams = {}) {
  return useQuery({
    queryKey: ['communication', 'messages', conversationId, params],
    queryFn: () => fetchMessages(conversationId, params),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: string; payload: SendMessagePayload }) =>
      sendMessage(conversationId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['communication', 'messages', variables.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateMessage(id, content),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useForwardMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetConversationId }: { id: string; targetConversationId: string }) =>
      forwardMessage(id, targetConversationId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useStarMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => starMessage(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markMessageRead(id),
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
  return useMutation({
    mutationFn: (id: string) => markCommunicationNotificationRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] }),
  });
}

export function useMarkAllCommunicationNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllCommunicationNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['communication', 'notifications'] }),
  });
}

export function useArchiveCommunicationNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveCommunicationNotification(id),
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
  return useMutation({
    mutationFn: (params: ReportParams) => exportCommunicationReport(params),
  });
}
