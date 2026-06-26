import {
  DealRepository,
  DEAL_STATUS,
  LEAD_PRIORITY,
} from '@domain/sales/sales.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import { SalesTargetService } from '@modules/sales/services/sales-target.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const DealService = {
  async list(companyId: string, query: {
    page?: number;
    pageSize?: number;
    status?: string;
    ownerId?: string;
    teamId?: string;
    pipelineId?: string;
    search?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.ownerId) filter.ownerId = query.ownerId;
    if (query.teamId) filter.teamId = query.teamId;
    if (query.pipelineId) filter.pipelineId = query.pipelineId;
    if (query.search) filter.$text = { $search: query.search };
    return DealRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const deal = await DealRepository.findById(id, { companyId });
    if (!deal) {
      throw new NotFoundError('Deal not found', ERROR_CODES.NOT_FOUND);
    }
    return deal;
  },

  async create(context: SalesActorContext, payload: {
    leadId?: string;
    name: string;
    value: number;
    currency?: string;
    expectedCloseDate?: Date;
    ownerId?: string;
    pipelineId?: string;
    stageId?: string;
    tags?: string[];
    priority?: string;
    teamId?: string;
  }) {
    const id = generateUuid();
    const created = await DealRepository.create(
      {
        id,
        companyId: context.companyId,
        leadId: payload.leadId,
        name: payload.name,
        value: payload.value,
        currency: payload.currency ?? 'INR',
        status: DEAL_STATUS.OPEN,
        expectedCloseDate: payload.expectedCloseDate,
        ownerId: payload.ownerId ?? context.employeeId ?? context.userId,
        pipelineId: payload.pipelineId,
        stageId: payload.stageId,
        tags: payload.tags ?? [],
        priority: payload.priority ?? LEAD_PRIORITY.MEDIUM,
        teamId: payload.teamId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'deal',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, id: string, payload: {
    name?: string;
    value?: number;
    currency?: string;
    status?: string;
    expectedCloseDate?: Date;
    ownerId?: string;
    pipelineId?: string;
    stageId?: string;
    tags?: string[];
    priority?: string;
    teamId?: string;
    wonReason?: string;
    lostReason?: string;
  }) {
    const before = await this.getById(context.companyId, id);
    const updatePayload: Record<string, unknown> = { ...payload, updatedBy: context.userId };

    if (payload.status === DEAL_STATUS.WON || payload.status === DEAL_STATUS.LOST) {
      updatePayload.closedAt = new Date();
    }

    const updated = await DealRepository.update(id, updatePayload, { companyId: context.companyId });

    if (!updated) {
      throw new NotFoundError('Deal not found', ERROR_CODES.NOT_FOUND);
    }

    if (payload.status === DEAL_STATUS.WON && updated.teamId) {
      const targets = await SalesTargetService.list(context.companyId, { teamId: updated.teamId, status: 'active' });
      for (const target of targets.items) {
        await SalesTargetService.recalculateAchievement(context.companyId, target.id);
      }
    }

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'deal',
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
    await DealRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'deal',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
