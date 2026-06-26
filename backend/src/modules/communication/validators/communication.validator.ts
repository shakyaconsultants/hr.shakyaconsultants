import { z } from 'zod';
import {
  ANNOUNCEMENT_AUDIENCE,
  ANNOUNCEMENT_PRIORITY,
  CHANNEL_SUBTYPE,
  CONVERSATION_TYPE,
} from '@domain/communication/communication.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { COMMUNICATION_REPORT_TYPE } from '@modules/communication/constants/communication.constants.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const dashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updatePoliciesSchema = z.object({
  allowDirectMessages: z.boolean().optional(),
  allowPrivateChannels: z.boolean().optional(),
  allowEmployeeChannels: z.boolean().optional(),
  maxAttachmentSizeMb: z.number().min(1).optional(),
  messageRetentionDays: z.number().min(1).optional(),
  requireAcknowledgementDefault: z.boolean().optional(),
  emergencyBypassQuietHours: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  policies: updatePoliciesSchema.optional(),
  templates: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    subject: z.string(),
    body: z.string(),
  })).optional(),
  preferences: z.object({
    emailEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
    digestFrequency: z.string().optional(),
    mutedCategories: z.array(z.string()).optional(),
  }).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  targetAudience: z.enum(Object.values(ANNOUNCEMENT_AUDIENCE) as [string, ...string[]]),
  targetIds: z.array(z.uuid()).optional(),
  priority: z.enum(Object.values(ANNOUNCEMENT_PRIORITY) as [string, ...string[]]).optional(),
  scheduledAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isPinned: z.boolean().optional(),
  isEmergency: z.boolean().optional(),
  requiresAcknowledgement: z.boolean().optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
  templateSlug: z.string().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  status: z.enum(Object.values(ENTITY_STATUS) as [string, ...string[]]).optional(),
});

export const announcementListQuerySchema = listQuerySchema.extend({
  targetAudience: z.enum(Object.values(ANNOUNCEMENT_AUDIENCE) as [string, ...string[]]).optional(),
});

export const createChannelSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  channelSubtype: z.enum(Object.values(CHANNEL_SUBTYPE) as [string, ...string[]]),
  participantIds: z.array(z.uuid()),
  relatedEntityId: z.uuid().optional(),
  isReadOnly: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
});

export const updateChannelSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  participantIds: z.array(z.uuid()).optional(),
  adminIds: z.array(z.uuid()).optional(),
  isReadOnly: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
});

export const channelListQuerySchema = listQuerySchema.extend({
  channelSubtype: z.enum(Object.values(CHANNEL_SUBTYPE) as [string, ...string[]]).optional(),
});

export const directConversationSchema = z.object({
  targetEmployeeId: z.uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  replyToMessageId: z.uuid().optional(),
  mentionIds: z.array(z.uuid()).optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    mimeType: z.string(),
    fileSize: z.number().min(0),
  })).optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1),
});

export const forwardMessageSchema = z.object({
  targetConversationId: z.uuid(),
});

export const notificationListQuerySchema = listQuerySchema.extend({
  isRead: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  category: z.string().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  types: z.array(z.enum(['messages', 'announcements', 'channels', 'attachments', 'mentions'])).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const reportQuerySchema = z.object({
  type: z.enum(Object.values(COMMUNICATION_REPORT_TYPE) as [string, ...string[]]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  channelId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
  format: z.string().optional(),
});

export const conversationTypeSchema = z.object({
  type: z.enum(Object.values(CONVERSATION_TYPE) as [string, ...string[]]).optional(),
});
