import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

const COMMUNICATION_PREFIX = '/api/v1/communication';

export type AnnouncementAudience = 'all' | 'department' | 'branch' | 'role' | 'team' | 'project';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ChannelSubtype = 'project' | 'department' | 'team' | 'announcement' | 'read_only' | 'private';
export type CommunicationReportType = 'reach' | 'read_stats' | 'channel_activity' | 'user_activity' | 'unread_summary';
export type SearchType = 'messages' | 'announcements' | 'channels' | 'attachments' | 'mentions';

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AnnouncementListParams extends ListParams {
  targetAudience?: AnnouncementAudience;
}

export interface ChannelListParams extends ListParams {
  channelSubtype?: ChannelSubtype;
}

export interface NotificationListParams extends ListParams {
  isRead?: boolean;
  isArchived?: boolean;
  category?: string;
}

export interface DashboardQuery {
  startDate?: string;
  endDate?: string;
}

export interface ReportParams {
  type: CommunicationReportType;
  startDate?: string;
  endDate?: string;
  channelId?: string;
  employeeId?: string;
}

export interface SearchParams {
  q: string;
  types?: SearchType[];
  limit?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  targetAudience: AnnouncementAudience;
  targetIds?: string[];
  priority: AnnouncementPriority;
  status: string;
  isPinned?: boolean;
  isEmergency?: boolean;
  requiresAcknowledgement?: boolean;
  authorEmployeeId?: string;
  authorUserId?: string;
  attachmentUrls?: string[];
  templateSlug?: string;
  createdAt?: string;
  updatedAt?: string;
  isRead?: boolean;
  isAcknowledged?: boolean;
  readReceipt?: Record<string, unknown> | null;
}

export interface AnnouncementStats {
  announcementId: string;
  title: string;
  readCount: number;
  acknowledgedCount: number;
  totalTarget?: number;
  readRate?: number;
}

export interface CommunicationPolicies {
  allowDirectMessages: boolean;
  allowPrivateChannels: boolean;
  allowEmployeeChannels: boolean;
  maxAttachmentSizeMb: number;
  messageRetentionDays: number;
  requireAcknowledgementDefault: boolean;
  emergencyBypassQuietHours: boolean;
}

export interface AnnouncementTemplate {
  slug: string;
  name: string;
  subject: string;
  body: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  digestFrequency: string;
  mutedCategories: string[];
}

export interface CommunicationSettings {
  policies: CommunicationPolicies;
  templates: AnnouncementTemplate[];
  preferences: NotificationPreferences;
}

export interface Conversation {
  id: string;
  title?: string;
  type: string;
  channelSubtype?: ChannelSubtype;
  participantIds: string[];
  adminIds?: string[];
  relatedEntityId?: string;
  isReadOnly?: boolean;
  isPrivate?: boolean;
  pinnedMessageIds?: string[];
  lastMessageAt?: string;
  description?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isEdited?: boolean;
  editedAt?: string;
  replyToMessageId?: string;
  mentionIds?: string[];
  isDeleted?: boolean;
  createdAt?: string;
}

export interface MessageAttachment {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export interface NotificationRecord {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  readAt?: string;
  entityType?: string;
  entityId?: string;
  category?: string;
  deepLink?: string;
  priority?: string;
  isArchived?: boolean;
  createdAt: string;
}

export interface EnterpriseDashboard {
  totalAnnouncements: number;
  activeChannels: number;
  totalMessages: number;
  totalNotifications: number;
  announcementReads: number;
  emergencyAnnouncements: number;
}

export interface ManagerDashboard {
  teamSize?: number;
  teamChannels: number;
  teamAnnouncements: number;
  unreadNotifications: number;
}

export interface WorkspaceDashboard {
  unreadNotifications: number;
  unreadMessages: number;
  activeConversations: number;
  recentNotificationCount: number;
}

export interface InboxCategory {
  total: number;
  unread: number;
  items: NotificationRecord[];
}

export interface InboxData {
  totalNotifications: number;
  totalUnread: number;
  categories: Record<string, InboxCategory>;
  recent: NotificationRecord[];
  page: number;
  pageSize: number;
}

export interface SearchResults {
  query: string;
  results: {
    messages?: Array<{ id: string; content: string; conversationId: string }>;
    announcements?: Array<{ id: string; title: string }>;
    channels?: Array<{ id: string; title?: string; channelSubtype?: string }>;
    attachments?: Array<{ id: string; fileName: string; messageId: string }>;
    mentions?: Array<{ id: string; content: string; conversationId: string }>;
  };
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  targetAudience: AnnouncementAudience;
  targetIds?: string[];
  priority?: AnnouncementPriority;
  scheduledAt?: string;
  expiresAt?: string;
  isPinned?: boolean;
  isEmergency?: boolean;
  requiresAcknowledgement?: boolean;
  attachmentUrls?: string[];
  templateSlug?: string;
}

export interface UpdateAnnouncementPayload extends Partial<CreateAnnouncementPayload> {
  status?: string;
}

export interface CreateChannelPayload {
  title: string;
  description?: string;
  channelSubtype: ChannelSubtype;
  participantIds: string[];
  relatedEntityId?: string;
  isReadOnly?: boolean;
  isPrivate?: boolean;
}

export interface UpdateChannelPayload {
  title?: string;
  description?: string;
  participantIds?: string[];
  adminIds?: string[];
  isReadOnly?: boolean;
  isPrivate?: boolean;
}

export interface SendMessagePayload {
  content: string;
  replyToMessageId?: string;
  mentionIds?: string[];
  attachments?: MessageAttachment[];
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

async function unwrapList<T>(response: { data: ApiSuccessResponse<T[] | ListResponse<T>> }): Promise<ListResponse<T>> {
  const { data } = response.data;
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, pageSize: data.length };
  }
  return data as ListResponse<T>;
}

async function unwrapPaginated<T>(response: {
  data: ApiSuccessResponse<T[]> | ApiSuccessResponse<PaginatedResult<T>>;
}): Promise<PaginatedResult<T> & { grouped?: Record<string, T[]> }> {
  const data = response.data?.data as any;
  if (data && 'items' in data && 'pagination' in data) {
    return {
      ...data,
      grouped: (response.data as any)?.grouped ?? data.grouped,
    };
  }
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  const pagination = (response.data as any)?.pagination ?? data?.pagination ?? {
    page: 1,
    pageSize: 20,
    total: items.length,
    totalPages: 1,
  };
  const grouped = (response.data as any)?.grouped ?? data?.grouped;
  return { items, pagination, grouped };
}

export async function fetchEnterpriseDashboard(params: DashboardQuery = {}): Promise<EnterpriseDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<EnterpriseDashboard>>(
    `${COMMUNICATION_PREFIX}/dashboard/enterprise`,
    { params },
  );
  return unwrap(response);
}

export async function fetchManagerDashboard(params: DashboardQuery = {}): Promise<ManagerDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<ManagerDashboard>>(
    `${COMMUNICATION_PREFIX}/dashboard/manager`,
    { params },
  );
  return unwrap(response);
}

export async function fetchWorkspaceDashboard(params: DashboardQuery = {}): Promise<WorkspaceDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<WorkspaceDashboard>>(
    `${COMMUNICATION_PREFIX}/dashboard/workspace`,
    { params },
  );
  return unwrap(response);
}

export async function fetchCommunicationPolicies(): Promise<CommunicationPolicies> {
  const response = await apiClient.get<ApiSuccessResponse<CommunicationPolicies>>(`${COMMUNICATION_PREFIX}/policies`);
  return unwrap(response);
}

export async function updateCommunicationPolicies(payload: Partial<CommunicationPolicies>): Promise<CommunicationPolicies> {
  const response = await apiClient.patch<ApiSuccessResponse<CommunicationPolicies>>(
    `${COMMUNICATION_PREFIX}/policies`,
    payload,
  );
  return unwrap(response);
}

export async function fetchCommunicationSettings(): Promise<CommunicationSettings> {
  const response = await apiClient.get<ApiSuccessResponse<CommunicationSettings>>(`${COMMUNICATION_PREFIX}/settings`);
  return unwrap(response);
}

export async function updateCommunicationSettings(payload: Partial<CommunicationSettings>): Promise<CommunicationSettings> {
  const response = await apiClient.patch<ApiSuccessResponse<CommunicationSettings>>(
    `${COMMUNICATION_PREFIX}/settings`,
    payload,
  );
  return unwrap(response);
}

export async function fetchAnnouncements(params: AnnouncementListParams = {}): Promise<ListResponse<Announcement>> {
  const response = await apiClient.get<ApiSuccessResponse<Announcement[] | ListResponse<Announcement>>>(
    `${COMMUNICATION_PREFIX}/announcements`,
    { params },
  );
  return unwrapList(response);
}

export async function fetchAnnouncement(id: string): Promise<Announcement> {
  const response = await apiClient.get<ApiSuccessResponse<Announcement>>(
    `${COMMUNICATION_PREFIX}/announcements/${id}`,
  );
  return unwrap(response);
}

export async function createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
  const response = await apiClient.post<ApiSuccessResponse<Announcement>>(
    `${COMMUNICATION_PREFIX}/announcements`,
    payload,
  );
  return unwrap(response);
}

export async function updateAnnouncement(id: string, payload: UpdateAnnouncementPayload): Promise<Announcement> {
  const response = await apiClient.patch<ApiSuccessResponse<Announcement>>(
    `${COMMUNICATION_PREFIX}/announcements/${id}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteAnnouncement(id: string): Promise<{ id: string; deleted: boolean }> {
  const response = await apiClient.delete<ApiSuccessResponse<{ id: string; deleted: boolean }>>(
    `${COMMUNICATION_PREFIX}/announcements/${id}`,
  );
  return unwrap(response);
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
  const response = await apiClient.post<ApiSuccessResponse<Announcement>>(
    `${COMMUNICATION_PREFIX}/announcements/${id}/publish`,
  );
  return unwrap(response);
}

export async function fetchAnnouncementStats(id: string): Promise<AnnouncementStats> {
  const response = await apiClient.get<ApiSuccessResponse<AnnouncementStats>>(
    `${COMMUNICATION_PREFIX}/announcements/${id}/stats`,
  );
  return unwrap(response);
}

export async function fetchAnnouncementHistory(params: AnnouncementListParams = {}): Promise<ListResponse<Announcement>> {
  const response = await apiClient.get<ApiSuccessResponse<Announcement[] | ListResponse<Announcement>>>(
    `${COMMUNICATION_PREFIX}/announcements/history`,
    { params },
  );
  return unwrapList(response);
}

export async function acknowledgeAnnouncement(id: string): Promise<Record<string, unknown>> {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${COMMUNICATION_PREFIX}/announcements/${id}/acknowledge`,
  );
  return unwrap(response);
}

export async function fetchChannels(params: ChannelListParams = {}): Promise<ListResponse<Conversation>> {
  const response = await apiClient.get<ApiSuccessResponse<Conversation[] | ListResponse<Conversation>>>(
    `${COMMUNICATION_PREFIX}/channels`,
    { params },
  );
  return unwrapList(response);
}

export async function fetchChannel(id: string): Promise<Conversation> {
  const response = await apiClient.get<ApiSuccessResponse<Conversation>>(`${COMMUNICATION_PREFIX}/channels/${id}`);
  return unwrap(response);
}

export async function createChannel(payload: CreateChannelPayload): Promise<Conversation> {
  const response = await apiClient.post<ApiSuccessResponse<Conversation>>(`${COMMUNICATION_PREFIX}/channels`, payload);
  return unwrap(response);
}

export async function updateChannel(id: string, payload: UpdateChannelPayload): Promise<Conversation> {
  const response = await apiClient.patch<ApiSuccessResponse<Conversation>>(
    `${COMMUNICATION_PREFIX}/channels/${id}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteChannel(id: string): Promise<{ id: string; deleted: boolean }> {
  const response = await apiClient.delete<ApiSuccessResponse<{ id: string; deleted: boolean }>>(
    `${COMMUNICATION_PREFIX}/channels/${id}`,
  );
  return unwrap(response);
}

export async function fetchChannelMembers(id: string): Promise<Array<{ id: string; name?: string }>> {
  const response = await apiClient.get<ApiSuccessResponse<Array<{ id: string; name?: string }>>>(
    `${COMMUNICATION_PREFIX}/channels/${id}/members`,
  );
  return unwrap(response);
}

export async function fetchDirectConversations(params: ListParams = {}): Promise<ListResponse<Conversation>> {
  const response = await apiClient.get<ApiSuccessResponse<Conversation[] | ListResponse<Conversation>>>(
    `${COMMUNICATION_PREFIX}/conversations/direct`,
    { params },
  );
  return unwrapList(response);
}

export async function fetchEmployeeDirectConversations(
  employeeId: string,
  params: ListParams = {},
): Promise<ListResponse<Conversation>> {
  const response = await apiClient.get<ApiSuccessResponse<Conversation[] | ListResponse<Conversation>>>(
    `${COMMUNICATION_PREFIX}/employees/${employeeId}/conversations/direct`,
    { params },
  );
  return unwrapList(response);
}

export async function createDirectConversation(targetEmployeeId: string): Promise<Conversation> {
  const response = await apiClient.post<ApiSuccessResponse<Conversation>>(
    `${COMMUNICATION_PREFIX}/conversations/direct`,
    { targetEmployeeId },
  );
  return unwrap(response);
}

export async function fetchMessages(conversationId: string, params: ListParams = {}): Promise<ListResponse<Message>> {
  const response = await apiClient.get<ApiSuccessResponse<Message[] | ListResponse<Message>>>(
    `${COMMUNICATION_PREFIX}/conversations/${conversationId}/messages`,
    { params },
  );
  return unwrapList(response);
}

export async function sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message> {
  const response = await apiClient.post<ApiSuccessResponse<Message>>(
    `${COMMUNICATION_PREFIX}/conversations/${conversationId}/messages`,
    payload,
  );
  return unwrap(response);
}

export async function updateMessage(id: string, content: string): Promise<Message> {
  const response = await apiClient.patch<ApiSuccessResponse<Message>>(`${COMMUNICATION_PREFIX}/messages/${id}`, {
    content,
  });
  return unwrap(response);
}

export async function deleteMessage(id: string): Promise<Message> {
  const response = await apiClient.delete<ApiSuccessResponse<Message>>(`${COMMUNICATION_PREFIX}/messages/${id}`);
  return unwrap(response);
}

export async function forwardMessage(id: string, targetConversationId: string): Promise<Message> {
  const response = await apiClient.post<ApiSuccessResponse<Message>>(`${COMMUNICATION_PREFIX}/messages/${id}/forward`, {
    targetConversationId,
  });
  return unwrap(response);
}

export async function starMessage(id: string): Promise<Record<string, unknown>> {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${COMMUNICATION_PREFIX}/messages/${id}/star`,
  );
  return unwrap(response);
}

export async function markMessageRead(id: string): Promise<Record<string, unknown>> {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${COMMUNICATION_PREFIX}/messages/${id}/read`,
  );
  return unwrap(response);
}

export async function fetchCommunicationNotifications(
  params: NotificationListParams = {},
): Promise<PaginatedResult<NotificationRecord> & { grouped?: Record<string, NotificationRecord[]> }> {
  const response = await apiClient.get<
    ApiSuccessResponse<NotificationRecord[]> & { pagination?: PaginationMeta; grouped?: Record<string, NotificationRecord[]> }
  >(`${COMMUNICATION_PREFIX}/notifications`, { params });
  return unwrapPaginated(response);
}

export async function markCommunicationNotificationRead(id: string): Promise<NotificationRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<NotificationRecord>>(
    `${COMMUNICATION_PREFIX}/notifications/${id}/read`,
  );
  return unwrap(response);
}

export async function markAllCommunicationNotificationsRead(): Promise<{ count: number }> {
  const response = await apiClient.post<ApiSuccessResponse<{ count: number }>>(
    `${COMMUNICATION_PREFIX}/notifications/mark-all-read`,
  );
  return unwrap(response);
}

export async function archiveCommunicationNotification(id: string): Promise<NotificationRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<NotificationRecord>>(
    `${COMMUNICATION_PREFIX}/notifications/${id}/archive`,
  );
  return unwrap(response);
}

export async function fetchInbox(params: ListParams = {}): Promise<InboxData> {
  const response = await apiClient.get<ApiSuccessResponse<InboxData>>(`${COMMUNICATION_PREFIX}/inbox`, { params });
  return unwrap(response);
}

export async function searchCommunication(params: SearchParams): Promise<SearchResults> {
  const response = await apiClient.get<ApiSuccessResponse<SearchResults>>(`${COMMUNICATION_PREFIX}/search`, {
    params: {
      q: params.q,
      types: params.types,
      limit: params.limit,
    },
  });
  return unwrap(response);
}

export async function fetchCommunicationReport(params: ReportParams): Promise<Record<string, unknown>> {
  const response = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${COMMUNICATION_PREFIX}/reports`,
    { params },
  );
  return unwrap(response);
}

export async function exportCommunicationReport(params: ReportParams): Promise<Blob> {
  const response = await apiClient.get(`${COMMUNICATION_PREFIX}/reports/export`, {
    params,
    responseType: 'blob',
  });
  return response.data as Blob;
}
