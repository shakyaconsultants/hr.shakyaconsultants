import { SalesTargetRepository, DealRepository } from '@domain/sales/sales.schemas.js';
import { SALES_TARGET_STATUS, DEAL_STATUS } from '@domain/sales/sales.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const SalesTargetService = {
  async list(companyId: string, query: {
    status?: string;
    page?: number;
    pageSize?: number;
    employeeId?: string;
    teamId?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.teamId) filter.teamId = query.teamId;
    return SalesTargetRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const target = await SalesTargetRepository.findById(id, { companyId });
    if (!target) {
      throw new NotFoundError('Sales target not found', ERROR_CODES.NOT_FOUND);
    }
    return target;
  },

  async create(context: SalesActorContext, payload: {
    employeeId?: string;
    teamId?: string;
    periodStart: Date;
    periodEnd: Date;
    targetValue: number;
    currency?: string;
  }) {
    const id = generateUuid();
    const created = await SalesTargetRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: payload.employeeId,
        teamId: payload.teamId,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
        targetValue: payload.targetValue,
        achievedValue: 0,
        currency: payload.currency ?? 'INR',
        status: SALES_TARGET_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_target',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, id: string, payload: {
    targetValue?: number;
    achievedValue?: number;
    status?: string;
    periodStart?: Date;
    periodEnd?: Date;
  }) {
    const before = await this.getById(context.companyId, id);
    const updated = await SalesTargetRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_target',
      entityId: id,
      action: 'update',
      before: SalesAuditService.toRecord(before),
      after: SalesAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async recalculateAchievement(companyId: string, targetId: string) {
    const target = await this.getById(companyId, targetId);
    const dealFilter: Record<string, unknown> = {
      status: DEAL_STATUS.WON,
      closedAt: { $gte: target.periodStart, $lte: target.periodEnd },
    };
    if (target.employeeId) dealFilter.ownerId = target.employeeId;
    if (target.teamId) dealFilter.teamId = target.teamId;

    const deals = await DealRepository.findMany(dealFilter, { companyId });
    const achievedValue = deals.reduce((sum, d) => sum + d.value, 0);
    const status = achievedValue >= target.targetValue ? SALES_TARGET_STATUS.COMPLETED : target.status;

    return SalesTargetRepository.update(
      targetId,
      { achievedValue, status },
      { companyId },
    );
  },

  async delete(context: SalesActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    await SalesTargetRepository.update(
      id,
      { status: SALES_TARGET_STATUS.CANCELLED, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_target',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
