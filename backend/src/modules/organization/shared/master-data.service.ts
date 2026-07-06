import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { CodeGenerationService } from '@modules/organization/services/code-generation.service.js';
import { entitySupportsAutoCode } from '@modules/organization/constants/code-generation.constants.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { MASTER_DATA_ENTITY } from '@modules/organization/constants/organization.constants.js';
import { DepartmentService } from '@modules/organization/services/department.service.js';
import { DepartmentValidationService } from '@modules/organization/services/department-validation.service.js';
import { DesignationService } from '@modules/organization/services/designation.service.js';
import { DesignationValidationService } from '@modules/organization/services/designation-validation.service.js';
import {
  HolidayModuleValidationService,
  HolidayValidationService,
} from '@modules/organization/services/holiday-module-validation.service.js';
import { DependencyValidatorService } from '@modules/organization/shared/dependency-validator.service.js';
import { MasterDataAuditService } from '@modules/organization/shared/master-data-audit.service.js';
import { MasterDataCacheService } from '@modules/organization/shared/master-data-cache.service.js';
import {
  MasterDataQueryService,
  type MasterDataListQuery,
} from '@modules/organization/shared/master-data-query.service.js';
import {
  serializeCursorMasterData,
  serializeMasterDataRecord,
  serializePaginatedMasterData,
} from '@modules/organization/shared/master-data-read.util.js';
import { documentToRecord } from '@shared/utils/document.util.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { CursorPaginationResult } from '@infrastructure/database/query/cursor-pagination.helper.js';

export interface MasterDataActorContext {
  companyId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

function toRecord(document: BaseDocument): Record<string, unknown> {
  return documentToRecord(document);
}

async function invalidateMasterDataCache(
  companyId: string,
  entityType: string,
  id?: string,
): Promise<void> {
  await MasterDataCacheService.invalidateEntity(companyId, entityType);
  if (id) {
    await MasterDataCacheService.invalidateRecord(companyId, entityType, id);
  }
}

function extractNameCode(payload: Record<string, unknown>): { name?: string; code?: string } {
  return {
    name: typeof payload.name === 'string' ? payload.name : undefined,
    code: typeof payload.code === 'string' ? payload.code : undefined,
  };
}

async function ensureAutoCode(
  entityKey: MasterDataEntityKey,
  companyId: string,
  userId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!entitySupportsAutoCode(entityKey)) {
    return payload;
  }

  if (typeof payload.code === 'string' && payload.code.trim()) {
    return { ...payload, code: payload.code.trim().toUpperCase() };
  }

  const name = typeof payload.name === 'string' ? payload.name : undefined;
  const config = resolveEntityConfig(entityKey);
  const code = await CodeGenerationService.ensureUnique(
    companyId,
    userId,
    entityKey,
    name,
    async (candidate) => config.repository.exists({ code: candidate }, { companyId }),
  );

  return { ...payload, code };
}

const DEPARTMENT_CLEARABLE_FIELDS = [
  'branchId',
  'parentDepartmentId',
  'headEmployeeId',
  'description',
  'email',
  'internalNotes',
] as const;

function buildDepartmentUpdateQuery(
  before: Record<string, unknown>,
  payload: Record<string, unknown>,
): { merged: Record<string, unknown>; unset: Record<string, 1> } {
  const unset: Record<string, 1> = {};
  const merged = { ...before };

  for (const [key, value] of Object.entries(payload)) {
    if (
      DEPARTMENT_CLEARABLE_FIELDS.includes(key as (typeof DEPARTMENT_CLEARABLE_FIELDS)[number]) &&
      value === null
    ) {
      merged[key] = undefined;
      unset[key] = 1;
      continue;
    }
    merged[key] = value;
  }

  return { merged, unset };
}

function stripSystemFields(payload: Record<string, unknown>): Record<string, unknown> {
  const next = { ...payload };
  delete next.id;
  delete next._id;
  delete next.companyId;
  delete next.createdAt;
  delete next.updatedAt;
  delete next.version;
  delete next.createdBy;
  delete next.updatedBy;
  return next;
}

function stripImmutableCode(payload: Record<string, unknown>): Record<string, unknown> {
  const next = stripSystemFields(payload);
  delete next.code;
  return next;
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
        return serializeMasterDataRecord(cached);
      }
    }

    const document = await config.repository.findById(id, {
      companyId: context.companyId,
      includeDeleted,
    });

    if (!document) {
      throw new NotFoundError(`${config.label} not found`, ERROR_CODES.NOT_FOUND);
    }

    const serialized = serializeMasterDataRecord(document);

    if (config.cacheEnabled && !includeDeleted) {
      await MasterDataCacheService.setJson(cacheKey, serialized);
    }

    return serialized;
  },

  async list(
    entityKey: MasterDataEntityKey,
    context: MasterDataActorContext,
    query: MasterDataListQuery,
  ): Promise<PaginatedResult<BaseDocument> | CursorPaginationResult<BaseDocument>> {
    if (entityKey === MASTER_DATA_ENTITY.DEPARTMENT && !query.useCursor) {
      const result = await DepartmentService.list(context.companyId, query);
      return serializePaginatedMasterData(result);
    }

    if (entityKey === MASTER_DATA_ENTITY.DESIGNATION && !query.useCursor) {
      const result = await DesignationService.list(context.companyId, query);
      return serializePaginatedMasterData(result);
    }

    if (query.useCursor) {
      const result = await MasterDataQueryService.listCursor(entityKey, context.companyId, query);
      if (MasterDataQueryService.shouldEnrichEmployeeCount(entityKey)) {
        return serializeCursorMasterData({
          ...result,
          items: await MasterDataQueryService.enrichDepartmentEmployeeCount(
            result.items,
            context.companyId,
          ),
        });
      }
      return serializeCursorMasterData(result);
    }

    const result = await MasterDataQueryService.listPaginated(entityKey, context.companyId, query);
    if (MasterDataQueryService.shouldEnrichEmployeeCount(entityKey)) {
      return serializePaginatedMasterData({
        ...result,
        items: await MasterDataQueryService.enrichDepartmentEmployeeCount(
          result.items,
          context.companyId,
        ),
      });
    }
    return serializePaginatedMasterData(result);
  },

  async create(
    entityKey: MasterDataEntityKey,
    payload: Record<string, unknown>,
    context: MasterDataActorContext,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    let finalPayload = payload;

    if (entityKey === MASTER_DATA_ENTITY.DEPARTMENT) {
      finalPayload = await DepartmentValidationService.validateWrite(context.companyId, payload);
    }

    if (entityKey === MASTER_DATA_ENTITY.DESIGNATION) {
      finalPayload = await DesignationValidationService.validateWrite(context.companyId, payload);
      await DesignationValidationService.assertUniqueName(
        context.companyId,
        typeof finalPayload.name === 'string' ? finalPayload.name : '',
        typeof finalPayload.departmentId === 'string' ? finalPayload.departmentId : undefined,
      );
    }

    if (entityKey === MASTER_DATA_ENTITY.HOLIDAY_MODULE) {
      finalPayload = await HolidayModuleValidationService.validateWrite(context.companyId, payload);
    }

    if (entityKey === MASTER_DATA_ENTITY.HOLIDAY) {
      finalPayload = await HolidayValidationService.validateWrite(context.companyId, payload);
    }

    finalPayload = await ensureAutoCode(entityKey, context.companyId, context.userId, finalPayload);

    const { name, code } = extractNameCode(finalPayload);

    await DependencyValidatorService.assertNoDuplicateNameOrCode(entityKey, context.companyId, {
      name,
      code,
    });

    const id = generateUuid();
    const document = await config.repository.create(
      {
        id,
        companyId: context.companyId,
        ...finalPayload,
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
      await invalidateMasterDataCache(context.companyId, config.entityType, id);
    }

    return serializeMasterDataRecord(document);
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
    let finalPayload = payload;

    if (entityKey === MASTER_DATA_ENTITY.DEPARTMENT) {
      const { merged, unset } = buildDepartmentUpdateQuery(before, payload);
      finalPayload = await DepartmentValidationService.validateWrite(context.companyId, merged, id);

      finalPayload = stripImmutableCode(finalPayload);

      const { name, code } = extractNameCode(finalPayload);

      await DependencyValidatorService.assertNoDuplicateNameOrCode(
        entityKey,
        context.companyId,
        { name, code },
        id,
      );

      const setPayload = Object.fromEntries(
        Object.entries({ ...finalPayload, updatedBy: context.userId }).filter(
          ([key]) => !(key in unset),
        ),
      ) as Record<string, unknown>;

      const updated = await config.repository.update(
        id,
        {
          $set: setPayload,
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
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
        await invalidateMasterDataCache(context.companyId, config.entityType, id);
      }

      return serializeMasterDataRecord(updated);
    }

    if (entityKey === MASTER_DATA_ENTITY.DESIGNATION) {
      const merged = { ...before, ...payload };
      finalPayload = await DesignationValidationService.validateWrite(
        context.companyId,
        merged,
        id,
      );
      await DesignationValidationService.assertUniqueName(
        context.companyId,
        typeof finalPayload.name === 'string'
          ? finalPayload.name
          : typeof merged.name === 'string'
            ? merged.name
            : '',
        typeof finalPayload.departmentId === 'string' ? finalPayload.departmentId : undefined,
        id,
      );
    }

    if (entityKey === MASTER_DATA_ENTITY.HOLIDAY_MODULE) {
      finalPayload = await HolidayModuleValidationService.validateWrite(context.companyId, {
        ...before,
        ...payload,
      });
    }

    if (entityKey === MASTER_DATA_ENTITY.HOLIDAY) {
      finalPayload = await HolidayValidationService.validateWrite(context.companyId, {
        ...before,
        ...payload,
      });
    }

    finalPayload = stripImmutableCode(finalPayload);

    const { name, code } = extractNameCode(finalPayload);

    await DependencyValidatorService.assertNoDuplicateNameOrCode(
      entityKey,
      context.companyId,
      { name, code },
      id,
    );

    const updated = await config.repository.update(
      id,
      { $set: { ...finalPayload, updatedBy: context.userId } },
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
      await invalidateMasterDataCache(context.companyId, config.entityType, id);
    }

    return serializeMasterDataRecord(updated);
  },

  async softDelete(
    entityKey: MasterDataEntityKey,
    id: string,
    context: MasterDataActorContext,
  ): Promise<BaseDocument> {
    const config = resolveEntityConfig(entityKey);
    const existing = await config.repository.findByIdOrFail(id, { companyId: context.companyId });

    if (entityKey === MASTER_DATA_ENTITY.HOLIDAY_MODULE) {
      await HolidayModuleValidationService.assertCanDelete(context.companyId, id);
    }

    await DependencyValidatorService.assertCanDelete(entityKey, id, context.companyId);

    const deleted = await config.repository.hardDelete(id, {
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
      await invalidateMasterDataCache(context.companyId, config.entityType, id);
    }

    return serializeMasterDataRecord({ ...existing, id });
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
      await invalidateMasterDataCache(context.companyId, config.entityType, id);
    }

    return serializeMasterDataRecord(restored);
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
