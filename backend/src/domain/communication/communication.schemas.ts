import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from '@shared/constants/notification.constants.js';

export const CONVERSATION_TYPE = {
  DIRECT: 'direct',
  GROUP: 'group',
  CHANNEL: 'channel',
} as const;

export const CHANNEL_SUBTYPE = {
  PROJECT: 'project',
  DEPARTMENT: 'department',
  TEAM: 'team',
  ANNOUNCEMENT: 'announcement',
  READ_ONLY: 'read_only',
  PRIVATE: 'private',
} as const;

export const ANNOUNCEMENT_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const ANNOUNCEMENT_AUDIENCE = {
  ALL: 'all',
  DEPARTMENT: 'department',
  BRANCH: 'branch',
  ROLE: 'role',
  TEAM: 'team',
  PROJECT: 'project',
} as const;

export const MESSAGE_DELIVERY_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

export const NOTIFICATION_CATEGORY = {
  SYSTEM: 'system',
  APPROVAL: 'approval',
  WORKFLOW: 'workflow',
  ASSIGNMENT: 'assignment',
  INTERVIEW: 'interview',
  PAYROLL: 'payroll',
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  SALES: 'sales',
  COMMUNICATION: 'communication',
  GENERAL: 'general',
} as const;

export interface NotificationDocument extends BaseDocument {
  recipientId: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  readAt?: Date;
  entityType?: string;
  entityId?: string;
  category?: string;
  deepLink?: string;
  priority?: string;
  isArchived: boolean;
}

export interface ConversationDocument extends BaseDocument {
  title?: string;
  type: string;
  channelSubtype?: string;
  participantIds: string[];
  adminIds: string[];
  relatedEntityId?: string;
  isReadOnly: boolean;
  isPrivate: boolean;
  pinnedMessageIds: string[];
  lastMessageAt?: Date;
  createdByParticipantId: string;
  description?: string;
}

export interface MessageDocument extends BaseDocument {
  conversationId: string;
  senderId: string;
  content: string;
  isEdited: boolean;
  editedAt?: Date;
  replyToMessageId?: string;
  forwardedFromMessageId?: string;
  isDeleted: boolean;
  mentionIds: string[];
}

export interface MessageAttachmentDocument extends BaseDocument {
  messageId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export interface MessageReceiptDocument extends BaseDocument {
  messageId: string;
  recipientId: string;
  deliveredAt?: Date;
  readAt?: Date;
  status: string;
}

export interface MessageUserStateDocument extends BaseDocument {
  messageId: string;
  userId: string;
  isStarred: boolean;
  isPinned: boolean;
}

export interface AnnouncementDocument extends BaseDocument {
  title: string;
  content: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  targetAudience: string;
  targetIds: string[];
  priority: string;
  status: string;
  isPinned: boolean;
  isEmergency: boolean;
  requiresAcknowledgement: boolean;
  authorEmployeeId?: string;
  authorUserId: string;
  attachmentUrls: string[];
  templateSlug?: string;
}

const notificationFields: SchemaDefinition = {
  recipientId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  channel: { type: String, enum: Object.values(NOTIFICATION_CHANNELS), default: NOTIFICATION_CHANNELS.DATABASE },
  status: { type: String, enum: Object.values(NOTIFICATION_STATUS), default: NOTIFICATION_STATUS.PENDING },
  readAt: { type: Date },
  entityType: { type: String, trim: true },
  entityId: { type: String, index: true },
  category: { type: String, trim: true, index: true },
  deepLink: { type: String, trim: true },
  priority: { type: String, trim: true },
  isArchived: { type: Boolean, default: false, index: true },
};

const conversationFields: SchemaDefinition = {
  title: { type: String, trim: true },
  type: { type: String, enum: Object.values(CONVERSATION_TYPE), default: CONVERSATION_TYPE.DIRECT },
  channelSubtype: { type: String, enum: Object.values(CHANNEL_SUBTYPE) },
  participantIds: { type: [String], required: true, default: [] },
  adminIds: { type: [String], default: [] },
  relatedEntityId: { type: String, index: true },
  isReadOnly: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  pinnedMessageIds: { type: [String], default: [] },
  lastMessageAt: { type: Date, index: true },
  createdByParticipantId: { type: String, required: true },
  description: { type: String, trim: true },
};

const messageFields: SchemaDefinition = {
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true, index: true },
  content: { type: String, required: true, trim: true },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  replyToMessageId: { type: String, index: true },
  forwardedFromMessageId: { type: String, index: true },
  isDeleted: { type: Boolean, default: false },
  mentionIds: { type: [String], default: [] },
};

const messageAttachmentFields: SchemaDefinition = {
  messageId: { type: String, required: true, index: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
};

const messageReceiptFields: SchemaDefinition = {
  messageId: { type: String, required: true, index: true },
  recipientId: { type: String, required: true, index: true },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  status: { type: String, enum: Object.values(MESSAGE_DELIVERY_STATUS), default: MESSAGE_DELIVERY_STATUS.SENT },
};

const messageUserStateFields: SchemaDefinition = {
  messageId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  isStarred: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
};

const announcementFields: SchemaDefinition = {
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  publishedAt: { type: Date, index: true },
  scheduledAt: { type: Date, index: true },
  expiresAt: { type: Date, index: true },
  targetAudience: { type: String, enum: Object.values(ANNOUNCEMENT_AUDIENCE), default: ANNOUNCEMENT_AUDIENCE.ALL },
  targetIds: { type: [String], default: [] },
  priority: { type: String, enum: Object.values(ANNOUNCEMENT_PRIORITY), default: ANNOUNCEMENT_PRIORITY.NORMAL },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
  isPinned: { type: Boolean, default: false, index: true },
  isEmergency: { type: Boolean, default: false, index: true },
  requiresAcknowledgement: { type: Boolean, default: false },
  authorEmployeeId: { type: String, index: true },
  authorUserId: { type: String, required: true },
  attachmentUrls: { type: [String], default: [] },
  templateSlug: { type: String, trim: true },
};

export const notificationModel = defineDomainModel<NotificationDocument>(
  'Notification',
  COLLECTIONS.NOTIFICATIONS,
  notificationFields,
  {
    indexes: [
      { fields: { companyId: 1, recipientId: 1, status: 1, createdAt: -1 }, options: { name: 'idx_notifications_company_recipient_status_date' } },
      { fields: { companyId: 1, recipientId: 1, readAt: 1 }, options: { name: 'idx_notifications_company_recipient_read' } },
      { fields: { companyId: 1, recipientId: 1, category: 1 }, options: { name: 'idx_notifications_company_recipient_category' } },
    ],
  },
);

export const conversationModel = defineDomainModel<ConversationDocument>(
  'Conversation',
  COLLECTIONS.CONVERSATIONS,
  conversationFields,
  {
    indexes: [
      { fields: { companyId: 1, participantIds: 1, lastMessageAt: -1 }, options: { name: 'idx_conversations_company_participants_date' } },
      { fields: { companyId: 1, type: 1, channelSubtype: 1 }, options: { name: 'idx_conversations_company_type_subtype' } },
      { fields: { companyId: 1, relatedEntityId: 1 }, options: { name: 'idx_conversations_company_related_entity', sparse: true } },
    ],
  },
);

export const messageModel = defineDomainModel<MessageDocument>(
  'Message',
  COLLECTIONS.MESSAGES,
  messageFields,
  {
    searchFields: ['content'],
    indexes: [
      { fields: { companyId: 1, conversationId: 1, createdAt: -1 }, options: { name: 'idx_messages_company_conversation_date' } },
    ],
  },
);

export const messageAttachmentModel = defineDomainModel<MessageAttachmentDocument>(
  'MessageAttachment',
  COLLECTIONS.MESSAGE_ATTACHMENTS,
  messageAttachmentFields,
  {
    indexes: [
      { fields: { companyId: 1, messageId: 1 }, options: { name: 'idx_message_attachments_company_message' } },
    ],
  },
);

export const messageReceiptModel = defineDomainModel<MessageReceiptDocument>(
  'MessageReceipt',
  COLLECTIONS.MESSAGE_RECEIPTS,
  messageReceiptFields,
  {
    indexes: [
      { fields: { companyId: 1, messageId: 1, recipientId: 1 }, options: { unique: true, name: 'uq_message_receipts' } },
      { fields: { companyId: 1, recipientId: 1, readAt: 1 }, options: { name: 'idx_message_receipts_recipient_read' } },
    ],
  },
);

export const messageUserStateModel = defineDomainModel<MessageUserStateDocument>(
  'MessageUserState',
  COLLECTIONS.MESSAGE_USER_STATES,
  messageUserStateFields,
  {
    indexes: [
      { fields: { companyId: 1, messageId: 1, userId: 1 }, options: { unique: true, name: 'uq_message_user_states' } },
      { fields: { companyId: 1, userId: 1, isStarred: 1 }, options: { name: 'idx_message_user_states_starred' } },
    ],
  },
);

export const announcementModel = defineDomainModel<AnnouncementDocument>(
  'Announcement',
  COLLECTIONS.ANNOUNCEMENTS,
  announcementFields,
  {
    searchFields: ['title', 'content'],
    indexes: [
      { fields: { companyId: 1, status: 1, publishedAt: -1 }, options: { name: 'idx_announcements_company_status_published' } },
      { fields: { companyId: 1, expiresAt: 1 }, options: { name: 'idx_announcements_company_expires', sparse: true } },
      { fields: { companyId: 1, scheduledAt: 1 }, options: { name: 'idx_announcements_company_scheduled', sparse: true } },
      { fields: { companyId: 1, isEmergency: 1 }, options: { name: 'idx_announcements_company_emergency' } },
    ],
  },
);

export const NotificationModel = notificationModel.model;
export const ConversationModel = conversationModel.model;
export const MessageModel = messageModel.model;
export const MessageAttachmentModel = messageAttachmentModel.model;
export const MessageReceiptModel = messageReceiptModel.model;
export const MessageUserStateModel = messageUserStateModel.model;
export const AnnouncementModel = announcementModel.model;

export const NotificationRepository = notificationModel.repository;
export const ConversationRepository = conversationModel.repository;
export const MessageRepository = messageModel.repository;
export const MessageAttachmentRepository = messageAttachmentModel.repository;
export const MessageReceiptRepository = messageReceiptModel.repository;
export const MessageUserStateRepository = messageUserStateModel.repository;
export const AnnouncementRepository = announcementModel.repository;
