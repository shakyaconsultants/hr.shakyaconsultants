import {
  ConversationRepository,
  CONVERSATION_TYPE,
  CHANNEL_SUBTYPE,
} from '@domain/communication/communication.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { BROADCAST_PERMISSIONS } from '@modules/communication/constants/communication-permissions.constants.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';
import { buildRegexFilter } from '@infrastructure/database/query/search.helper.js';

interface ChannelListQuery {
  page?: number;
  pageSize?: number;
  channelSubtype?: string;
  search?: string;
}

interface CreateChannelInput {
  title: string;
  description?: string;
  channelSubtype: string;
  participantIds: string[];
  relatedEntityId?: string;
  isReadOnly?: boolean;
  isPrivate?: boolean;
}

interface UpdateChannelInput {
  title?: string;
  description?: string;
  participantIds?: string[];
  adminIds?: string[];
  isReadOnly?: boolean;
  isPrivate?: boolean;
  status?: string;
}

async function getDirectReportIds(companyId: string, managerEmployeeId: string): Promise<string[]> {
  const reports = await EmployeeRepository.findMany(
    { reportingManagerId: managerEmployeeId },
    { companyId },
  );
  return reports.map((r) => r.id);
}

function isChannelAdmin(
  conversation: { adminIds: string[]; createdByParticipantId: string },
  employeeId: string,
): boolean {
  return (
    conversation.adminIds.includes(employeeId) || conversation.createdByParticipantId === employeeId
  );
}

export const ChannelService = {
  async list(context: CommunicationActorContext, permissions: string[], query: ChannelListQuery) {
    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    const filter: Record<string, unknown> = { type: CONVERSATION_TYPE.CHANNEL };

    if (query.channelSubtype) filter.channelSubtype = query.channelSubtype;
    if (query.search?.trim()) filter.title = buildRegexFilter(query.search);

    if (!canBroadcast && context.employeeId) {
      filter.participantIds = context.employeeId;
    }

    return ConversationRepository.paginate(
      filter,
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'lastMessageAt',
        sortOrder: 'desc',
      },
      { companyId: context.companyId },
    );
  },

  async getById(context: CommunicationActorContext, permissions: string[], id: string) {
    const channel = await ConversationRepository.findById(id, { companyId: context.companyId });
    if (!channel || channel.type !== CONVERSATION_TYPE.CHANNEL) {
      throw new NotFoundError('Channel not found', ERROR_CODES.NOT_FOUND);
    }

    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    if (
      !canBroadcast &&
      context.employeeId &&
      !channel.participantIds.includes(context.employeeId)
    ) {
      throw new ForbiddenError('Not a channel member', ERROR_CODES.AUTH_FORBIDDEN);
    }

    return CommunicationAuditService.toRecord(channel);
  },

  async getMembers(companyId: string, id: string) {
    const channel = await ConversationRepository.findById(id, { companyId });
    if (!channel || channel.type !== CONVERSATION_TYPE.CHANNEL) {
      throw new NotFoundError('Channel not found', ERROR_CODES.NOT_FOUND);
    }

    const employees = await EmployeeRepository.findMany(
      { id: { $in: channel.participantIds } },
      { companyId },
    );
    return {
      channelId: id,
      participantIds: channel.participantIds,
      adminIds: channel.adminIds,
      members: employees.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        departmentId: e.departmentId,
      })),
    };
  },

  async create(
    context: CommunicationActorContext,
    permissions: string[],
    input: CreateChannelInput,
  ) {
    if (!context.employeeId && !context.isSuperAdmin) {
      throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const canBroadcast =
      permissions.includes(BROADCAST_PERMISSIONS.BROADCAST) || context.isSuperAdmin;
    const authorEmployeeId = context.employeeId ?? context.userId;
    const participantIds = [...new Set([authorEmployeeId, ...input.participantIds])];

    if (!canBroadcast) {
      if (input.channelSubtype === CHANNEL_SUBTYPE.DEPARTMENT) {
        throw new ForbiddenError(
          'Only admins can create department channels',
          ERROR_CODES.AUTH_FORBIDDEN,
        );
      }
      if (input.channelSubtype === CHANNEL_SUBTYPE.TEAM) {
        const directReports = await getDirectReportIds(context.companyId, authorEmployeeId);
        const allowed = new Set([authorEmployeeId, ...directReports]);
        const invalid = participantIds.filter((id) => !allowed.has(id));
        if (invalid.length > 0) {
          throw new ForbiddenError(
            'Team channels may only include your direct reports',
            ERROR_CODES.AUTH_FORBIDDEN,
          );
        }
      }
      if (input.channelSubtype === CHANNEL_SUBTYPE.PROJECT && input.relatedEntityId) {
        const membership = await ProjectMemberRepository.findOne(
          { projectId: input.relatedEntityId, employeeId: authorEmployeeId },
          { companyId: context.companyId },
        );
        if (!membership) {
          throw new ForbiddenError(
            'You must be a project member to create this channel',
            ERROR_CODES.AUTH_FORBIDDEN,
          );
        }
      }
    }

    const channel = await ConversationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        title: input.title,
        description: input.description,
        type: CONVERSATION_TYPE.CHANNEL,
        channelSubtype: input.channelSubtype,
        participantIds,
        adminIds: [authorEmployeeId],
        relatedEntityId: input.relatedEntityId,
        isReadOnly: input.isReadOnly ?? input.channelSubtype === CHANNEL_SUBTYPE.READ_ONLY,
        isPrivate: input.isPrivate ?? input.channelSubtype === CHANNEL_SUBTYPE.PRIVATE,
        pinnedMessageIds: [],
        createdByParticipantId: authorEmployeeId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'channel',
      entityId: channel.id,
      action: 'create',
      after: CommunicationAuditService.toRecord(channel),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(channel);
  },

  async update(
    context: CommunicationActorContext,
    permissions: string[],
    id: string,
    input: UpdateChannelInput,
  ) {
    const existing = await ConversationRepository.findById(id, { companyId: context.companyId });
    if (!existing || existing.type !== CONVERSATION_TYPE.CHANNEL) {
      throw new NotFoundError('Channel not found', ERROR_CODES.NOT_FOUND);
    }

    const canBroadcast =
      permissions.includes(BROADCAST_PERMISSIONS.BROADCAST) || context.isSuperAdmin;
    if (!canBroadcast) {
      if (!context.employeeId || !isChannelAdmin(existing, context.employeeId)) {
        throw new ForbiddenError('Channel admin access required', ERROR_CODES.AUTH_FORBIDDEN);
      }
    }

    const updated = await ConversationRepository.update(
      id,
      { ...input, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'channel',
      entityId: id,
      action: 'update',
      before: CommunicationAuditService.toRecord(existing),
      after: CommunicationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(updated);
  },

  async delete(context: CommunicationActorContext, permissions: string[], id: string) {
    const existing = await ConversationRepository.findById(id, { companyId: context.companyId });
    if (!existing || existing.type !== CONVERSATION_TYPE.CHANNEL) {
      throw new NotFoundError('Channel not found', ERROR_CODES.NOT_FOUND);
    }

    const canBroadcast =
      permissions.includes(BROADCAST_PERMISSIONS.BROADCAST) || context.isSuperAdmin;
    if (!canBroadcast) {
      if (!context.employeeId || !isChannelAdmin(existing, context.employeeId)) {
        throw new ForbiddenError('Channel admin access required', ERROR_CODES.AUTH_FORBIDDEN);
      }
    }

    await ConversationRepository.update(
      id,
      { isDeleted: true, deletedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'channel',
      entityId: id,
      action: 'delete',
      before: CommunicationAuditService.toRecord(existing),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { id, deleted: true };
  },

  async getOrCreateCompanyChat(context: CommunicationActorContext) {
    const COMPANY_CHAT_ENTITY_ID = 'company-wide';
    const authorEmployeeId = context.employeeId ?? context.userId;

    const existing = await ConversationRepository.findOne(
      {
        type: CONVERSATION_TYPE.CHANNEL,
        relatedEntityId: COMPANY_CHAT_ENTITY_ID,
      },
      { companyId: context.companyId },
    );

    if (existing) {
      if (context.employeeId && !existing.participantIds.includes(context.employeeId)) {
        const updated = await ConversationRepository.update(
          existing.id,
          {
            participantIds: [...new Set([...existing.participantIds, context.employeeId])],
            updatedBy: context.userId,
          },
          { companyId: context.companyId },
        );
        return CommunicationAuditService.toRecord(updated ?? existing);
      }
      return CommunicationAuditService.toRecord(existing);
    }

    const employees = await EmployeeRepository.findMany(
      { status: ENTITY_STATUS.ACTIVE },
      { companyId: context.companyId },
    );
    const participantIds = [...new Set(employees.map((employee) => employee.id))];
    if (authorEmployeeId && !participantIds.includes(authorEmployeeId)) {
      participantIds.push(authorEmployeeId);
    }

    const channel = await ConversationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        title: 'Everyone',
        description: 'Company-wide chat — visible to all employees',
        type: CONVERSATION_TYPE.CHANNEL,
        channelSubtype: CHANNEL_SUBTYPE.TEAM,
        participantIds,
        adminIds: authorEmployeeId ? [authorEmployeeId] : [],
        relatedEntityId: COMPANY_CHAT_ENTITY_ID,
        isReadOnly: false,
        isPrivate: false,
        pinnedMessageIds: [],
        createdByParticipantId: authorEmployeeId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return CommunicationAuditService.toRecord(channel);
  },
};
