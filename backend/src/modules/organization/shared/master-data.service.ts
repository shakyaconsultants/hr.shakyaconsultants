import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { DependencyValidatorService } from '@modules/organization/shared/dependency-validator.service.js';
import { MasterDataAuditService } from '@modules/organization/shared/master-data-audit.service.js';
import { MasterDataCacheService } from '@modules/organization/shared/master-data-cache.service.js';
import { MasterDataQueryService, type MasterDataListQuery } from '@modules/organization/shared/master-data-query.service.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { CursorPaginationResult } from '@infrastructure/database/query/cursor-pagination.helper.js';

export interface MasterDataActorContext {
  companyId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

function toRecord(document: BaseDocument): Record<string, unknown> {
  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

function extractNameCode(payload: Record<string, unknown>): { name?: string; code?: string } {
  return {
    name: typeof payload.name === 'string' ? payload.name : undefined,
    code: typeof payload.code === 'string' ? payload.code : undefined,
  };
}

export const MasterDataService = {
  async getById(
    entityKey: MasterDataEntityKey,
    id: string,
    context: MasterDataActorContext,
    includeDeleted = false,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    const cacheKey = MasterDataCacheService.buildKey(context.companyId, config.entityType, id);

    if (config.cacheEnabled && !includeDeleted) {
      const cached = await MasterDataCacheService.getJson<BaseDocument>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const document = await config.repository.findById(id, {
      companyId: context.companyId,
      includeDeleted,
    });

    if (!document) {
      throw new NotFoundError(`${config.label} not found`, ERROR_CODES.NOT_FOUND);
    }

    if (config.cacheEnabled && !includeDeleted) {
      await MasterDataCacheService.setJson(cacheKey, document);
    }

    return document;
  },

  async list(
    entityKey: MasterDataEntityKey,
    context: MasterDataActorContext,
    query: MasterDataListQuery,
  ): Promise<PaginatedResult<BaseDocument> | CursorPaginationResult<BaseDocument>> {
    if (query.useCursor) {
      const result = await MasterDataQueryService.listCursor(entityKey, context.companyId, query);
      if (MasterDataQueryService.shouldEnrichEmployeeCount(entityKey)) {
        return {
          ...result,
          items: await MasterDataQueryService.enrichDepartmentEmployeeCount(result.items, context.companyId),
        };
      }
      return result;
    }

    const result = await MasterDataQueryService.listPaginated(entityKey, context.companyId, query);
    if (MasterDataQueryService.shouldEnrichEmployeeCount(entityKey)) {
      return {
        ...result,
        items: await MasterDataQueryService.enrichDepartmentEmployeeCount(result.items, context.companyId),
      };
    }
    return result;
  },

  async create(
    entityKey: MasterDataEntityKey,
    payload: Record<string, unknown>,
    context: MasterDataActorContext,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    const { name, code } = extractNameCode(payload);

    await DependencyValidatorService.assertNoDuplicateNameOrCode(
      entityKey,
      context.companyId,
      { name, code },
    );

    const id = generateUuid();
    const document = await config.repository.create(
      {
        id,
        companyId: context.companyId,
        ...payload,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: id,
      action: 'create',
      after: toRecord(document),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    if (config.cacheEnabled) {
      await MasterDataCacheService.invalidateEntity(context.companyId, config.entityType);
    }

    return document;
  },

  async update(
    entityKey: MasterDataEntityKey,
    id: string,
    payload: Record<string, unknown>,
    context: MasterDataActorContext,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    const existing = await config.repository.findByIdOrFail(id, { companyId: context.companyId });
    const before = toRecord(existing);
    const { name, code } = extractNameCode(payload);

    await DependencyValidatorService.assertNoDuplicateNameOrCode(
      entityKey,
      context.companyId,
      { name, code },
      id,
    );

    const updated = await config.repository.update(
      id,
      { $set: { ...payload, updatedBy: context.userId } },
      { companyId: context.companyId, updatedBy: context.userId },
    );

    if (!updated) {
      throw new NotFoundError(`${config.label} not found`, ERROR_CODES.NOT_FOUND);
    }

    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: id,
      action: 'update',
      before,
      after: toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    if (config.cacheEnabled) {
      await MasterDataCacheService.invalidateEntity(context.companyId, config.entityType);
    }

    return updated;
  },

  async softDelete(
    entityKey: MasterDataEntityKey,
    id: string,
    context: MasterDataActorContext,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    const existing = await config.repository.findByIdOrFail(id, { companyId: context.companyId });

    await DependencyValidatorService.assertCanDelete(entityKey, id, context.companyId);

    const deleted = await config.repository.softDelete(id, context.userId, {
      companyId: context.companyId,
    });

    if (!deleted) {
      throw new NotFoundError(`${config.label} not found`, ERROR_CODES.NOT_FOUND);
    }

    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: id,
      action: 'delete',
      before: toRecord(existing),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    if (config.cacheEnabled) {
      await MasterDataCacheService.invalidateEntity(context.companyId, config.entityType);
    }

    return deleted;
  },

  async restore(
    entityKey: MasterDataEntityKey,
    id: string,
    context: MasterDataActorContext,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    const existing = await config.repository.findById(id, {
      companyId: context.companyId,
      includeDeleted: true,
    });

    if (!existing) {
      throw new NotFoundError(`${config.label} not found`, ERROR_CODES.NOT_FOUND);
    }

    const restored = await config.repository.restore(id, context.userId, {
      companyId: context.companyId,
      includeDeleted: true,
    });

    if (!restored) {
      throw new NotFoundError(`${config.label} not found`, ERROR_CODES.NOT_FOUND);
    }

    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: id,
      action: 'restore',
      before: toRecord(existing),
      after: toRecord(restored),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    if (config.cacheEnabled) {
      await MasterDataCacheService.invalidateEntity(context.companyId, config.entityType);
    }

    return restored;
  },

  async bulkCreate(
    entityKey: MasterDataEntityKey,
    items: Record<string, unknown>[],
    context: MasterDataActorContext,
  ): Promise<BaseDocument[]> {
    const config = resolveEntityConfig(entityKey);
    const created: BaseDocument[] = [];

    for (const item of items) {
      const doc = await this.create(entityKey, item, context);
      created.push(doc);
    }

    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: 'bulk',
      action: 'bulk_create',
      after: { count: created.length, ids: created.map((d) => d.id) },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return created;
  },

  async bulkUpdate(
    entityKey: MasterDataEntityKey,
    updates: Array<{ id: string; data: Record<string, unknown> }>,
    context: MasterDataActorContext,
  ): Promise<BaseDocument[]> {
    const updated: BaseDocument[] = [];
    for (const entry of updates) {
      const doc = await this.update(entityKey, entry.id, entry.data, context);
      updated.push(doc);
    }
    return updated;
  },

  async bulkDelete(
    entityKey: MasterDataEntityKey,
    ids: string[],
    context: MasterDataActorContext,
  ): Promise<{ deleted: string[] }> {
    const deleted: string[] = [];
    for (const id of ids) {
      await this.softDelete(entityKey, id, context);
      deleted.push(id);
    }
    return { deleted };
  },
};
