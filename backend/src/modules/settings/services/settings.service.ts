import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import type { AppSettingDocument } from '@domain/master-data/master-data.schemas.js';
import { NotFoundError, ConflictError, BadRequestError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { MasterDataAuditService } from '@modules/organization/shared/master-data-audit.service.js';
import { MasterDataCacheService } from '@modules/organization/shared/master-data-cache.service.js';
import { SettingVersionService } from '@modules/settings/services/setting-version.service.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';
import type { CreateSettingInput, UpdateSettingInput } from '@modules/settings/validators/settings.validator.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

const SETTINGS_CACHE_ENTITY = 'settings';

function toRecord(document: AppSettingDocument): Record<string, unknown> {
  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

function validateSettingValue(valueType: string, value: unknown): void {
  if (value === null || value === undefined) {
    return;
  }

  switch (valueType) {
    case 'string':
      if (typeof value !== 'string') {
        throw new BadRequestError('Setting value must be a string');
      }
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new BadRequestError('Setting value must be a number');
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new BadRequestError('Setting value must be a boolean');
      }
      break;
    case 'json':
      if (typeof value !== 'object') {
        throw new BadRequestError('Setting value must be a JSON object');
      }
      break;
    default:
      break;
  }
}

export interface SettingsListQuery {
  group?: string;
  isPublic?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const SettingsService = {
  async list(companyId: string, query: SettingsListQuery): Promise<PaginatedResult<AppSettingDocument>> {
    const cacheKey = MasterDataCacheService.buildKey(companyId, SETTINGS_CACHE_ENTITY, `list:${JSON.stringify(query)}`);
    const cached = await MasterDataCacheService.getJson<PaginatedResult<AppSettingDocument>>(cacheKey);
    if (cached) {
      return cached;
    }

    const filter: Record<string, unknown> = {};
    if (query.group) {
      filter.group = query.group;
    }
    if (query.isPublic !== undefined) {
      filter.isPublic = query.isPublic;
    }
    if (query.search) {
      Object.assign(filter, buildSearchFilter(query.search, ['key', 'description']));
    }

    const result = await AppSettingRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'group',
      sortOrder: 'asc',
      companyId,
    });

    await MasterDataCacheService.setJson(cacheKey, result);
    return result;
  },

  async getPublicSettings(companyId: string): Promise<AppSettingDocument[]> {
    const cacheKey = MasterDataCacheService.buildKey(companyId, SETTINGS_CACHE_ENTITY, 'public');
    const cached = await MasterDataCacheService.getJson<AppSettingDocument[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const settings = await AppSettingRepository.findMany({ isPublic: true }, { companyId });
    await MasterDataCacheService.setJson(cacheKey, settings);
    return settings;
  },

  async getByKey(companyId: string, key: string): Promise<AppSettingDocument> {
    const setting = await AppSettingRepository.findOne({ key: key.toLowerCase() }, { companyId });
    if (!setting) {
      throw new NotFoundError('Setting not found', ERROR_CODES.NOT_FOUND);
    }
    return setting;
  },

  async getByGroup(companyId: string, group: string): Promise<AppSettingDocument[]> {
    return AppSettingRepository.findMany({ group }, { companyId });
  },

  async create(
    companyId: string,
    input: CreateSettingInput,
    context: MasterDataActorContext,
  ): Promise<AppSettingDocument> {
    const existing = await AppSettingRepository.findOne({ key: input.key.toLowerCase() }, { companyId });
    if (existing) {
      throw new ConflictError('Setting key already exists', ERROR_CODES.CONFLICT, { key: input.key });
    }

    validateSettingValue(input.valueType, input.value);

    const id = generateUuid();
    const setting = await AppSettingRepository.create(
      {
        id,
        companyId,
        key: input.key.toLowerCase(),
        name: input.name,
        category: input.category,
        value: input.value,
        valueType: input.valueType,
        defaultValue: input.defaultValue,
        group: input.group,
        description: input.description,
        isEditable: input.isEditable,
        isPublic: input.isPublic,
        validation: input.validation ?? {},
        encrypted: input.encrypted,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId },
    );

    await MasterDataAuditService.log({
      companyId,
      userId: context.userId,
      entityType: SETTINGS_CACHE_ENTITY,
      entityId: id,
      action: 'create',
      after: toRecord(setting),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await MasterDataCacheService.invalidateEntity(companyId, SETTINGS_CACHE_ENTITY);
    return setting;
  },

  async update(
    companyId: string,
    key: string,
    input: UpdateSettingInput,
    context: MasterDataActorContext,
  ): Promise<AppSettingDocument> {
    const existing = await this.getByKey(companyId, key);
    if (!existing.isEditable) {
      throw new BadRequestError('Setting is not editable');
    }

    const valueType = input.valueType ?? existing.valueType;
    if (input.value !== undefined) {
      validateSettingValue(valueType, input.value);
    }

    const before = toRecord(existing);

    await SettingVersionService.recordVersion({
      companyId,
      setting: existing,
      changedBy: context.userId,
      changeReason: input.changeReason,
    });

    const { changeReason: _changeReason, ...updateFields } = input;
    const updated = await AppSettingRepository.update(
      existing.id,
      { $set: { ...updateFields, updatedBy: context.userId } },
      { companyId, updatedBy: context.userId },
    );

    if (!updated) {
      throw new NotFoundError('Setting not found', ERROR_CODES.NOT_FOUND);
    }

    await MasterDataAuditService.log({
      companyId,
      userId: context.userId,
      entityType: SETTINGS_CACHE_ENTITY,
      entityId: existing.id,
      action: 'update',
      before,
      after: toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await MasterDataCacheService.invalidateEntity(companyId, SETTINGS_CACHE_ENTITY);
    return updated;
  },

  async softDelete(
    companyId: string,
    key: string,
    context: MasterDataActorContext,
  ): Promise<void> {
    const existing = await this.getByKey(companyId, key);
    const before = toRecord(existing);

    await AppSettingRepository.softDelete(existing.id, context.userId, { companyId });

    await MasterDataAuditService.log({
      companyId,
      userId: context.userId,
      entityType: SETTINGS_CACHE_ENTITY,
      entityId: existing.id,
      action: 'delete',
      before,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await MasterDataCacheService.invalidateEntity(companyId, SETTINGS_CACHE_ENTITY);
  },
};
