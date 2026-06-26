import { LeadSourceRepository } from '@domain/sales/sales.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const LeadSourceService = {
  async list(companyId: string, query: { status?: string; page?: number; pageSize?: number; search?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.search) filter.$text = { $search: query.search };
    return LeadSourceRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'name',
      sortOrder: 'asc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const source = await LeadSourceRepository.findById(id, { companyId });
    if (!source) {
      throw new NotFoundError('Lead source not found', ERROR_CODES.NOT_FOUND);
    }
    return source;
  },

  async create(context: SalesActorContext, payload: { name: string; code: string; description?: string }) {
    const id = generateUuid();
    const created = await LeadSourceRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        code: payload.code.toUpperCase(),
        description: payload.description,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_source',
      entityId: id,
      action: 'create',
      after: SalesAuditService.toRecord(created),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async update(context: SalesActorContext, id: string, payload: { name?: string; description?: string; status?: string }) {
    const before = await this.getById(context.companyId, id);
    const updated = await LeadSourceRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_source',
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
    await LeadSourceRepository.update(id, { status: ENTITY_STATUS.INACTIVE, updatedBy: context.userId }, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'lead_source',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
