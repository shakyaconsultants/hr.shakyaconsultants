import { FollowUpRepository, FOLLOW_UP_STATUS } from '@domain/sales/sales.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const FollowUpService = {
  async list(companyId: string, query: {
    page?: number;
    pageSize?: number;
    leadId?: string;
    dealId?: string;
    assignedToId?: string;
    status?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.leadId) filter.leadId = query.leadId;
    if (query.dealId) filter.dealId = query.dealId;
    if (query.assignedToId) filter.assignedToId = query.assignedToId;
    if (query.status) filter.status = query.status;
    return FollowUpRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'scheduledAt',
      sortOrder: 'asc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const followUp = await FollowUpRepository.findById(id, { companyId });
    if (!followUp) {
      throw new NotFoundError('Follow-up not found', ERROR_CODES.NOT_FOUND);
    }
    return followUp;
  },

  async create(context: SalesActorContext, payload: {
    leadId?: string;
    dealId?: string;
    assignedToId: string;
    scheduledAt: Date;
    notes?: string;
  }) {
    const id = generateUuid();
    const created = await FollowUpRepository.create(
      {
        id,
        companyId: context.companyId,
        leadId: payload.leadId,
        dealId: payload.dealId,
        assignedToId: payload.assignedToId,
        scheduledAt: payload.scheduledAt,
        status: FOLLOW_UP_STATUS.PENDING,
        notes: payload.notes,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'follow_up',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, id: string, payload: {
    scheduledAt?: Date;
    notes?: string;
    status?: string;
    completedAt?: Date;
  }) {
    const before = await this.getById(context.companyId, id);
    const updatePayload = { ...payload, updatedBy: context.userId };
    if (payload.status === FOLLOW_UP_STATUS.COMPLETED && !payload.completedAt) {
      updatePayload.completedAt = new Date();
    }
    const updated = await FollowUpRepository.update(id, updatePayload, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'follow_up',
      entityId: id,
      action: 'update',
      before: SalesAuditService.toRecord(before),
      after: SalesAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: SalesActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    await FollowUpRepository.update(
      id,
      { status: FOLLOW_UP_STATUS.CANCELLED, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'follow_up',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
