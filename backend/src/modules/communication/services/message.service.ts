import {
  MessageRepository,
  MessageAttachmentRepository,
  MessageReceiptRepository,
  MessageUserStateRepository,
  ConversationRepository,
  MESSAGE_DELIVERY_STATUS,
} from '@domain/communication/communication.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { COMMUNICATION_NOTIFICATION_JOB } from '@modules/communication/constants/communication.constants.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import { CommunicationEventService } from '@modules/communication/services/communication-event.service.js';
import { CommunicationSocketService } from '@modules/communication/services/communication-socket.service.js';
import {
  enrichMessageRecord,
  enrichMessageRecords,
} from '@modules/communication/services/message-display.service.js';
import {
  canSendInConversation,
  isConversationParticipant,
  primaryActorParticipantId,
} from '@modules/communication/utils/participant.util.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

interface MessageListQuery {
  page?: number;
  pageSize?: number;
}

interface SendMessageInput {
  content: string;
  replyToMessageId?: string;
  forwardedFromMessageId?: string;
  mentionIds?: string[];
  attachments?: Array<{ fileName: string; fileUrl: string; mimeType: string; fileSize: number }>;
}

interface UpdateMessageInput {
  content: string;
}

export const MessageService = {
  async list(context: CommunicationActorContext, conversationId: string, query: MessageListQuery) {
    const conversation = await ConversationRepository.findById(conversationId, {
      companyId: context.companyId,
    });
    if (!conversation) {
      throw new NotFoundError('Conversation not found', ERROR_CODES.NOT_FOUND);
    }

    if (!isConversationParticipant(context, conversation.participantIds)) {
      throw new ForbiddenError('Not a conversation participant', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const result = await MessageRepository.paginate(
      { conversationId, isDeleted: false },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      { companyId: context.companyId },
    );

    const items = await enrichMessageRecords(
      context.companyId,
      result.items.map((item) => CommunicationAuditService.toRecord(item)),
    );

    return { ...result, items };
  },

  async send(context: CommunicationActorContext, conversationId: string, input: SendMessageInput) {
    const senderId = primaryActorParticipantId(context);
    if (!senderId) {
      throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const conversation = await ConversationRepository.findById(conversationId, {
      companyId: context.companyId,
    });
    if (!conversation) {
      throw new NotFoundError('Conversation not found', ERROR_CODES.NOT_FOUND);
    }

    if (!canSendInConversation(context, conversation.participantIds)) {
      throw new ForbiddenError('Not a conversation participant', ERROR_CODES.AUTH_FORBIDDEN);
    }

    if (conversation.isReadOnly && !context.isSuperAdmin) {
      throw new ForbiddenError('Channel is read-only', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const message = await MessageRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        conversationId,
        senderId,
        content: input.content,
        isEdited: false,
        replyToMessageId: input.replyToMessageId,
        forwardedFromMessageId: input.forwardedFromMessageId,
        isDeleted: false,
        mentionIds: input.mentionIds ?? [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (input.attachments?.length) {
      for (const attachment of input.attachments) {
        await MessageAttachmentRepository.create(
          {
            id: generateUuid(),
            companyId: context.companyId,
            messageId: message.id,
            ...attachment,
            createdBy: context.userId,
            updatedBy: context.userId,
          },
          { companyId: context.companyId },
        );
      }
    }

    const otherParticipants = conversation.participantIds.filter((id) => id !== senderId);
    for (const recipientId of otherParticipants) {
      await MessageReceiptRepository.create(
        {
          id: generateUuid(),
          companyId: context.companyId,
          messageId: message.id,
          recipientId,
          status: MESSAGE_DELIVERY_STATUS.SENT,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }

    await ConversationRepository.update(
      conversationId,
      { lastMessageAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    if (input.mentionIds?.length) {
      for (const mentionId of input.mentionIds) {
        const employee = await EmployeeRepository.findById(mentionId, {
          companyId: context.companyId,
        });
        if (employee?.userId) {
          await CommunicationEventService.notify(context, {
            recipientUserId: employee.userId,
            title: 'You were mentioned',
            body: input.content.slice(0, 200),
            entityType: 'message',
            entityId: message.id,
            jobName: COMMUNICATION_NOTIFICATION_JOB.MESSAGE_MENTION,
          });
        }
      }
    }

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'message',
      entityId: message.id,
      action: 'send',
      after: CommunicationAuditService.toRecord(message),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const record = await enrichMessageRecord(
      context.companyId,
      CommunicationAuditService.toRecord(message),
    );
    CommunicationSocketService.emitNewMessage(conversationId, record);
    return record;
  },

  async update(context: CommunicationActorContext, messageId: string, input: UpdateMessageInput) {
    if (!context.employeeId && !context.isSuperAdmin) {
      throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const message = await MessageRepository.findById(messageId, { companyId: context.companyId });
    if (!message || message.isDeleted) {
      throw new NotFoundError('Message not found', ERROR_CODES.NOT_FOUND);
    }

    const senderId = context.employeeId ?? context.userId;

    if (!context.isSuperAdmin && message.senderId !== senderId) {
      throw new ForbiddenError('Only the sender can edit this message', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const updated = await MessageRepository.update(
      messageId,
      { content: input.content, isEdited: true, editedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    return CommunicationAuditService.toRecord(updated);
  },

  async delete(context: CommunicationActorContext, messageId: string) {
    if (!context.employeeId && !context.isSuperAdmin) {
      throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const message = await MessageRepository.findById(messageId, { companyId: context.companyId });
    if (!message || message.isDeleted) {
      throw new NotFoundError('Message not found', ERROR_CODES.NOT_FOUND);
    }

    const senderId = context.employeeId ?? context.userId;

    if (!context.isSuperAdmin && message.senderId !== senderId) {
      throw new ForbiddenError(
        'Only the sender can delete this message',
        ERROR_CODES.AUTH_FORBIDDEN,
      );
    }

    const updated = await MessageRepository.update(
      messageId,
      { isDeleted: true, deletedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    return CommunicationAuditService.toRecord(updated);
  },

  async forward(
    context: CommunicationActorContext,
    messageId: string,
    targetConversationId: string,
  ) {
    const message = await MessageRepository.findById(messageId, { companyId: context.companyId });
    if (!message || message.isDeleted) {
      throw new NotFoundError('Message not found', ERROR_CODES.NOT_FOUND);
    }

    return this.send(context, targetConversationId, {
      content: message.content,
      forwardedFromMessageId: messageId,
    });
  },

  async markRead(context: CommunicationActorContext, messageId: string) {
    if (!context.employeeId && !context.isSuperAdmin) {
      throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const message = await MessageRepository.findById(messageId, { companyId: context.companyId });
    if (!message) {
      throw new NotFoundError('Message not found', ERROR_CODES.NOT_FOUND);
    }

    const recipientId = context.employeeId ?? context.userId;

    const existing = await MessageReceiptRepository.findOne(
      { messageId, recipientId },
      { companyId: context.companyId },
    );

    const now = new Date();
    if (existing) {
      const updated = await MessageReceiptRepository.update(
        existing.id,
        { readAt: now, status: MESSAGE_DELIVERY_STATUS.READ, updatedBy: context.userId },
        { companyId: context.companyId },
      );
      return CommunicationAuditService.toRecord(updated);
    }

    const receipt = await MessageReceiptRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        messageId,
        recipientId,
        readAt: now,
        status: MESSAGE_DELIVERY_STATUS.READ,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return CommunicationAuditService.toRecord(receipt);
  },

  async star(context: CommunicationActorContext, messageId: string, starred = true) {
    if (!context.employeeId && !context.isSuperAdmin) {
      throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const message = await MessageRepository.findById(messageId, { companyId: context.companyId });
    if (!message) {
      throw new NotFoundError('Message not found', ERROR_CODES.NOT_FOUND);
    }

    const targetUserId = context.employeeId ?? context.userId;

    const existing = await MessageUserStateRepository.findOne(
      { messageId, userId: targetUserId },
      { companyId: context.companyId },
    );

    if (existing) {
      const updated = await MessageUserStateRepository.update(
        existing.id,
        { isStarred: starred, updatedBy: context.userId },
        { companyId: context.companyId },
      );
      return CommunicationAuditService.toRecord(updated);
    }

    const state = await MessageUserStateRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        messageId,
        userId: targetUserId,
        isStarred: starred,
        isPinned: false,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return CommunicationAuditService.toRecord(state);
  },
};
