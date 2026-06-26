import type { PermissionDocument } from '@domain/permission/permission.schemas.js';
import {
  PermissionGroupRepository,
  PermissionRepository,
} from '@domain/permission/permission.schemas.js';
import { PermissionCategoryRepository } from '@domain/permission/rbac.schemas.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { getCatalogEntryByCode } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { RbacAuditService } from '@modules/rbac/services/rbac-audit.service.js';

export interface PermissionListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  module?: string;
  groupId?: string;
  category?: string;
  status?: string;
}

function toRecord(doc: PermissionDocument): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
}

export const PermissionManagementService = {
  async list(query: PermissionListQuery): Promise<PaginatedResult<PermissionDocument>> {
    const filters = [];
    if (query.module) {
      filters.push({ module: query.module });
    }
    if (query.groupId) {
      filters.push({ permissionGroupId: query.groupId });
    }
    if (query.category) {
      filters.push({ category: query.category });
    }
    if (query.status) {
      filters.push({ status: query.status });
    }
    if (query.search) {
      filters.push(buildSearchFilter(query.search, ['code', 'name', 'description', 'module']));
    }

    return PermissionRepository.paginate(mergeFilters(...filters), {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    });
  },

  async getById(id: string): Promise<PermissionDocument> {
    const permission = await PermissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found', ERROR_CODES.NOT_FOUND);
    }
    return permission;
  },

  async create(
    companyId: string,
    payload: {
      code: string;
      name: string;
      description?: string;
      module: string;
      action: string;
      category?: string;
      permissionGroupId?: string;
      dependsOn?: string[];
      metadata?: Record<string, unknown>;
      sortOrder?: number;
    },
    actor: RbacActorContext,
  ): Promise<PermissionDocument> {
    const existing = await PermissionRepository.findOne({ code: payload.code });
    if (existing) {
      throw new ConflictError('Permission code already exists', ERROR_CODES.CONFLICT, { code: payload.code });
    }

    for (const dep of payload.dependsOn ?? []) {
      const depExists = await PermissionRepository.findOne({ code: dep });
      const inCatalog = getCatalogEntryByCode(dep);
      if (!depExists && !inCatalog) {
        throw new ConflictError(`Invalid permission dependency: ${dep}`, ERROR_CODES.CONFLICT);
      }
    }

    const id = generateUuid();
    const permission = await PermissionRepository.create({
      id,
      companyId,
      ...payload,
      dependsOn: payload.dependsOn ?? [],
      metadata: payload.metadata ?? {},
      isSystem: false,
      sortOrder: payload.sortOrder ?? 0,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'permission',
      entityId: id,
      action: 'create',
      after: toRecord(permission),
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return permission;
  },

  async listGroups(companyId: string): Promise<unknown[]> {
    return PermissionGroupRepository.findMany({}, { companyId });
  },

  async listCategories(companyId: string): Promise<unknown[]> {
    return PermissionCategoryRepository.findMany({}, { companyId });
  },

  async getMatrix(companyId: string): Promise<{
    permissions: PermissionDocument[];
    groups: unknown[];
    categories: unknown[];
  }> {
    const [permissions, groups, categories] = await Promise.all([
      PermissionRepository.findMany({ status: 'active' }),
      PermissionGroupRepository.findMany({}, { companyId }),
      PermissionCategoryRepository.findMany({}, { companyId }),
    ]);

    return { permissions, groups, categories };
  },
};
