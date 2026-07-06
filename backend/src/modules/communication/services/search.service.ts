import {
  MessageRepository,
  AnnouncementRepository,
  ConversationRepository,
  MessageAttachmentRepository,
  CONVERSATION_TYPE,
} from '@domain/communication/communication.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';
import { BROADCAST_PERMISSIONS } from '@modules/communication/constants/communication-permissions.constants.js';
import { buildRegexFilter } from '@infrastructure/database/query/search.helper.js';

interface SearchQuery {
  q: string;
  types?: string[];
  limit?: number;
}

export const CommunicationSearchService = {
  async search(context: CommunicationActorContext, permissions: string[], query: SearchQuery) {
    const limit = query.limit ?? 20;
    const types = query.types ?? [
      'messages',
      'announcements',
      'channels',
      'attachments',
      'mentions',
    ];
    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    const results: Record<string, unknown[]> = {};

    const searchRegex = query.q.trim() ? buildRegexFilter(query.q) : null;

    if (types.includes('messages') && context.employeeId && searchRegex) {
      const conversations = await ConversationRepository.findMany(
        { participantIds: context.employeeId },
        { companyId: context.companyId },
      );
      const conversationIds = conversations.map((c) => c.id);
      const messages =
        conversationIds.length > 0
          ? await MessageRepository.findMany(
              { conversationId: { $in: conversationIds }, content: searchRegex, isDeleted: false },
              { companyId: context.companyId },
            )
          : [];
      results.messages = messages
        .slice(0, limit)
        .map((m) => ({ id: m.id, content: m.content, conversationId: m.conversationId }));
    }

    if (types.includes('announcements') && searchRegex) {
      const filter: Record<string, unknown> = {
        status: ENTITY_STATUS.ACTIVE,
        $or: [{ title: searchRegex }, { content: searchRegex }],
      };
      const announcements = await AnnouncementRepository.findMany(filter, {
        companyId: context.companyId,
      });
      results.announcements = announcements
        .slice(0, limit)
        .map((a) => ({ id: a.id, title: a.title }));
    }

    if (types.includes('channels') && searchRegex) {
      const filter: Record<string, unknown> = {
        type: CONVERSATION_TYPE.CHANNEL,
        title: searchRegex,
      };
      if (!canBroadcast && context.employeeId) {
        filter.participantIds = context.employeeId;
      }
      const channels = await ConversationRepository.findMany(filter, {
        companyId: context.companyId,
      });
      results.channels = channels
        .slice(0, limit)
        .map((c) => ({ id: c.id, title: c.title, channelSubtype: c.channelSubtype }));
    }

    if (types.includes('attachments') && searchRegex) {
      const attachments = await MessageAttachmentRepository.findMany(
        { fileName: searchRegex },
        { companyId: context.companyId },
      );
      results.attachments = attachments
        .slice(0, limit)
        .map((a) => ({ id: a.id, fileName: a.fileName, messageId: a.messageId }));
    }

    if (types.includes('mentions') && context.employeeId) {
      const messages = await MessageRepository.findMany(
        { mentionIds: context.employeeId, isDeleted: false },
        { companyId: context.companyId },
      );
      results.mentions = messages
        .slice(0, limit)
        .map((m) => ({ id: m.id, content: m.content, conversationId: m.conversationId }));
    }

    return { query: query.q, results };
  },
};
