import { CallLogRepository, CALL_DIRECTION } from '@domain/sales/sales.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { LeadActivityService } from '@modules/sales/services/lead-activity.service.js';
import { LEAD_ACTIVITY_TYPE } from '@domain/sales/sales.schemas.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const CallLogService = {
  async list(companyId: string, query: {
    page?: number;
    pageSize?: number;
    leadId?: string;
    dealId?: string;
    employeeId?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.leadId) filter.leadId = query.leadId;
    if (query.dealId) filter.dealId = query.dealId;
    if (query.employeeId) filter.employeeId = query.employeeId;
    return CallLogRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'calledAt',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const log = await CallLogRepository.findById(id, { companyId });
    if (!log) {
      throw new NotFoundError('Call log not found', ERROR_CODES.NOT_FOUND);
    }
    return log;
  },

  async create(context: SalesActorContext, payload: {
    leadId?: string;
    dealId?: string;
    direction: string;
    durationSeconds: number;
    outcome?: string;
    notes?: string;
    calledAt?: Date;
  }) {
    const id = generateUuid();
    const employeeId = context.employeeId ?? context.userId;
    const created = await CallLogRepository.create(
      {
        id,
        companyId: context.companyId,
        leadId: payload.leadId,
        dealId: payload.dealId,
        employeeId,
        direction: payload.direction,
        durationSeconds: payload.durationSeconds,
        outcome: payload.outcome,
        notes: payload.notes,
        calledAt: payload.calledAt ?? new Date(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (payload.leadId) {
      await LeadActivityService.create(context, {
        leadId: payload.leadId,
        type: LEAD_ACTIVITY_TYPE.CALL,
        title: `${payload.direction === CALL_DIRECTION.INBOUND ? 'Inbound' : 'Outbound'} call`,
        description: payload.notes ?? `Call duration: ${payload.durationSeconds}s`,
        metadata: { callLogId: id, direction: payload.direction, durationSeconds: payload.durationSeconds },
      });
    }

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'call_log',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, id: string, payload: {
    outcome?: string;
    notes?: string;
    durationSeconds?: number;
  }) {
    const before = await this.getById(context.companyId, id);
    const updated = await CallLogRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'call_log',
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
    await CallLogRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'call_log',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
