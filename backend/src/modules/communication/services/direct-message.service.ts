import {
  ConversationRepository,
  CONVERSATION_TYPE,
} from '@domain/communication/communication.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import { enrichDirectConversationList } from '@modules/communication/services/conversation-display.service.js';
import {
  actorParticipantIds,
  primaryActorParticipantId,
} from '@modules/communication/utils/participant.util.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

interface DirectConversationQuery {
  page?: number;
  pageSize?: number;
}

async function enrichList(
  context: CommunicationActorContext,
  result: { items: unknown[]; pagination: unknown },
) {
  const records = result.items.map((item) => CommunicationAuditService.toRecord(item));
  const enriched = await enrichDirectConversationList(context, records);
  return { ...result, items: enriched };
}

export const DirectMessageService = {
  async list(context: CommunicationActorContext, query: DirectConversationQuery) {
    const actorIds = actorParticipantIds(context);
    if (actorIds.length === 0) {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    }

    const result = await ConversationRepository.paginate(
      { type: CONVERSATION_TYPE.DIRECT, participantIds: { $in: actorIds } },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      },
      { companyId: context.companyId },
    );

    return enrichList(context, result);
  },

  async listForEmployee(companyId: string, employeeId: string, query: DirectConversationQuery) {
    const result = await ConversationRepository.paginate(
      { type: CONVERSATION_TYPE.DIRECT, participantIds: employeeId },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      },
      { companyId },
    );

    const context: CommunicationActorContext = {
      companyId,
      userId: 'system',
      employeeId,
    };

    return enrichList(context, result);
  },

  async findOrCreate(context: CommunicationActorContext, targetEmployeeId: string) {
    const actorId = primaryActorParticipantId(context);
    if (!actorId) {
      throw new NotFoundError('Employee profile required', ERROR_CODES.NOT_FOUND);
    }

    const target = await EmployeeRepository.findById(targetEmployeeId, {
      companyId: context.companyId,
    });
    if (!target) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (actorId === targetEmployeeId) {
      throw new NotFoundError('Cannot start conversation with yourself', ERROR_CODES.NOT_FOUND);
    }

    const participantPair = [actorId, targetEmployeeId].sort();

    let existing = await ConversationRepository.findOne(
      {
        type: CONVERSATION_TYPE.DIRECT,
        participantIds: { $all: participantPair, $size: 2 },
      },
      { companyId: context.companyId },
    );

    if (!existing) {
      const actorIds = actorParticipantIds(context);
      for (const legacyId of actorIds) {
        if (legacyId === actorId) continue;
        existing = await ConversationRepository.findOne(
          {
            type: CONVERSATION_TYPE.DIRECT,
            participantIds: { $all: [legacyId, targetEmployeeId], $size: 2 },
          },
          { companyId: context.companyId },
        );
        if (existing) break;
      }
    }

    if (existing) {
      const record = CommunicationAuditService.toRecord(existing);
      const [enriched] = await enrichDirectConversationList(context, [record]);
      return enriched;
    }

    const conversation = await ConversationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        type: CONVERSATION_TYPE.DIRECT,
        participantIds: participantPair,
        adminIds: [],
        isReadOnly: false,
        isPrivate: true,
        pinnedMessageIds: [],
        createdByParticipantId: actorId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'conversation',
      entityId: conversation.id,
      action: 'create',
      after: CommunicationAuditService.toRecord(conversation),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const record = CommunicationAuditService.toRecord(conversation);
    const [enriched] = await enrichDirectConversationList(context, [record]);
    return enriched;
  },
};
