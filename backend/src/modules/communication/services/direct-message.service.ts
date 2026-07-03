import {
  ConversationRepository,
  CONVERSATION_TYPE,
} from '@domain/communication/communication.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

interface DirectConversationQuery {
  page?: number;
  pageSize?: number;
}

export const DirectMessageService = {
  async list(context: CommunicationActorContext, query: DirectConversationQuery) {
    const actorEmployeeId = context.employeeId ?? (context.isSuperAdmin ? context.userId : undefined);
    if (!actorEmployeeId) {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    }

    return ConversationRepository.paginate(
      { type: CONVERSATION_TYPE.DIRECT, participantIds: actorEmployeeId },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      },
      { companyId: context.companyId },
    );
  },

  async listForEmployee(companyId: string, employeeId: string, query: DirectConversationQuery) {
    return ConversationRepository.paginate(
      { type: CONVERSATION_TYPE.DIRECT, participantIds: employeeId },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      },
      { companyId },
    );
  },

  async findOrCreate(context: CommunicationActorContext, targetEmployeeId: string) {
    const actorEmployeeId = context.employeeId ?? (context.isSuperAdmin ? context.userId : undefined);
    if (!actorEmployeeId) {
      throw new NotFoundError('Employee profile required', ERROR_CODES.NOT_FOUND);
    }

    if (actorEmployeeId === targetEmployeeId) {
      throw new NotFoundError('Cannot start conversation with yourself', ERROR_CODES.NOT_FOUND);
    }

    const target = await EmployeeRepository.findById(targetEmployeeId, { companyId: context.companyId });
    if (!target) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const existing = await ConversationRepository.findOne(
      {
        type: CONVERSATION_TYPE.DIRECT,
        participantIds: { $all: [actorEmployeeId, targetEmployeeId], $size: 2 },
      },
      { companyId: context.companyId },
    );

    if (existing) {
      return CommunicationAuditService.toRecord(existing);
    }

    const conversation = await ConversationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        type: CONVERSATION_TYPE.DIRECT,
        participantIds: [actorEmployeeId, targetEmployeeId],
        adminIds: [],
        isReadOnly: false,
        isPrivate: true,
        pinnedMessageIds: [],
        createdByParticipantId: actorEmployeeId,
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

    return CommunicationAuditService.toRecord(conversation);
  },
};
