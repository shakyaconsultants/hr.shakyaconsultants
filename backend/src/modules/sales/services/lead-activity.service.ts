import {
  LeadActivityRepository,
  LEAD_ACTIVITY_TYPE,
} from '@domain/sales/sales.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { LeadRepository } from '@domain/sales/sales.schemas.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const LeadActivityService = {
  async list(companyId: string, query: { leadId?: string; page?: number; pageSize?: number; type?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.leadId) filter.leadId = query.leadId;
    if (query.type) filter.type = query.type;
    return LeadActivityRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'performedAt',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getTimeline(companyId: string, leadId: string) {
    const activities = await LeadActivityRepository.findMany({ leadId }, { companyId });
    return activities.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  },

  async create(context: SalesActorContext, payload: {
    leadId: string;
    type: string;
    description: string;
    title?: string;
    metadata?: Record<string, unknown>;
    attachmentUrls?: string[];
    fromStageId?: string;
    toStageId?: string;
  }) {
    const lead = await LeadRepository.findById(payload.leadId, { companyId: context.companyId });
    if (!lead) {
      throw new NotFoundError('Lead not found', ERROR_CODES.NOT_FOUND);
    }

    const id = generateUuid();
    const now = new Date();
    const activity = await LeadActivityRepository.create(
      {
        id,
        companyId: context.companyId,
        leadId: payload.leadId,
        type: payload.type,
        description: payload.description,
        performedBy: context.employeeId ?? context.userId,
        performedAt: now,
        title: payload.title,
        metadata: payload.metadata ?? {},
        attachmentUrls: payload.attachmentUrls ?? [],
        fromStageId: payload.fromStageId,
        toStageId: payload.toStageId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await LeadRepository.update(
      payload.leadId,
      { lastActivityAt: now, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_activity',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(activity),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return activity;
  },

  async update(context: SalesActorContext, id: string, payload: {
    description?: string;
    title?: string;
    metadata?: Record<string, unknown>;
    attachmentUrls?: string[];
  }) {
    const before = await LeadActivityRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Activity not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await LeadActivityRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_activity',
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
    const before = await LeadActivityRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Activity not found', ERROR_CODES.NOT_FOUND);
    }

    await LeadActivityRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_activity',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async logAssignment(context: SalesActorContext, leadId: string, input: {
    assignedToId: string;
    assignmentType: string;
    reason?: string;
  }) {
    return this.create(context, {
      leadId,
      type: LEAD_ACTIVITY_TYPE.ASSIGNMENT,
      title: 'Lead assigned',
      description: `Assigned to ${input.assignedToId}${input.reason ? `: ${input.reason}` : ''}`,
      metadata: { assignedToId: input.assignedToId, assignmentType: input.assignmentType },
    });
  },

  async logPipelineMove(context: SalesActorContext, leadId: string, input: {
    fromStageId?: string;
    toStageId: string;
    pipelineId?: string;
  }) {
    return this.create(context, {
      leadId,
      type: LEAD_ACTIVITY_TYPE.PIPELINE_MOVE,
      title: 'Pipeline stage changed',
      description: `Moved from ${input.fromStageId ?? 'none'} to ${input.toStageId}`,
      fromStageId: input.fromStageId,
      toStageId: input.toStageId,
      metadata: { pipelineId: input.pipelineId },
    });
  },

  async logStatusChange(context: SalesActorContext, leadId: string, input: {
    fromStatus: string;
    toStatus: string;
  }) {
    return this.create(context, {
      leadId,
      type: LEAD_ACTIVITY_TYPE.STATUS_CHANGE,
      title: 'Status changed',
      description: `Status changed from ${input.fromStatus} to ${input.toStatus}`,
      metadata: input,
    });
  },
};
