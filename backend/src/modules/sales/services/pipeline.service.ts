import { PipelineRepository } from '@domain/sales/sales.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { DEFAULT_PIPELINE_STAGES } from '@modules/sales/constants/sales.constants.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const PipelineService = {
  async ensureDefaultPipeline(context: SalesActorContext): Promise<void> {
    const existing = await PipelineRepository.findOne({ isDefault: true }, { companyId: context.companyId });
    if (existing) return;

    await PipelineRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        name: 'Default Sales Pipeline',
        description: 'Standard sales pipeline',
        stages: DEFAULT_PIPELINE_STAGES.map((s) => ({ ...s })),
        isDefault: true,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async list(companyId: string, query: { status?: string; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    return PipelineRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'name',
      sortOrder: 'asc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const pipeline = await PipelineRepository.findById(id, { companyId });
    if (!pipeline) {
      throw new NotFoundError('Pipeline not found', ERROR_CODES.NOT_FOUND);
    }
    return pipeline;
  },

  async getDefault(companyId: string) {
    const pipeline = await PipelineRepository.findOne({ isDefault: true, status: ENTITY_STATUS.ACTIVE }, { companyId });
    if (!pipeline) {
      throw new NotFoundError('Default pipeline not found', ERROR_CODES.NOT_FOUND);
    }
    return pipeline;
  },

  async create(context: SalesActorContext, payload: {
    name: string;
    description?: string;
    stages?: Array<{ id: string; name: string; order: number; probability?: number }>;
    isDefault?: boolean;
  }) {
    const id = generateUuid();
    if (payload.isDefault) {
      const defaults = await PipelineRepository.findMany({ isDefault: true }, { companyId: context.companyId });
      for (const d of defaults) {
        await PipelineRepository.update(d.id, { isDefault: false, updatedBy: context.userId }, { companyId: context.companyId });
      }
    }

    const created = await PipelineRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        description: payload.description,
        stages: payload.stages ?? DEFAULT_PIPELINE_STAGES.map((s) => ({ ...s })),
        isDefault: payload.isDefault ?? false,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'pipeline',
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
    description?: string;
    stages?: Array<{ id: string; name: string; order: number; probability?: number }>;
    isDefault?: boolean;
    status?: string;
  }) {
    const before = await this.getById(context.companyId, id);

    if (payload.isDefault) {
      const defaults = await PipelineRepository.findMany({ isDefault: true }, { companyId: context.companyId });
      for (const d of defaults) {
        if (d.id !== id) {
          await PipelineRepository.update(d.id, { isDefault: false, updatedBy: context.userId }, { companyId: context.companyId });
        }
      }
    }

    const updated = await PipelineRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'pipeline',
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
    if (before.isDefault) {
      throw new NotFoundError('Cannot delete default pipeline', ERROR_CODES.BAD_REQUEST);
    }
    await PipelineRepository.update(id, { status: ENTITY_STATUS.INACTIVE, updatedBy: context.userId }, { companyId: context.companyId });

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'pipeline',
      entityId: id,
      action: 'delete',
      before: SalesAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
