import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { buildExactFilter, mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import { buildDateRangeFilter } from '@infrastructure/database/query/date-range.helper.js';
import {
  buildCursorFilter,
  extractNextCursor,
  resolveCursorLimit,
  type CursorPaginationResult,
} from '@infrastructure/database/query/cursor-pagination.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { MASTER_DATA_ENTITY } from '@modules/organization/constants/organization.constants.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';

export interface MasterDataListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  includeDeleted?: boolean;
  branchId?: string;
  departmentId?: string;
  parentDepartmentId?: string;
  headEmployeeId?: string;
  salaryGradeId?: string;
  hierarchyLevel?: number;
  type?: string;
  group?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  useCursor?: boolean;
  limit?: number;
}

function buildListFilter(entityKey: MasterDataEntityKey, query: MasterDataListQuery): DomainQueryFilter {
  const config = resolveEntityConfig(entityKey);
  const filters: DomainQueryFilter[] = [];

  if (query.status) {
    filters.push(buildExactFilter({ status: query.status }));
  }

  if (query.branchId) {
    filters.push(buildExactFilter({ branchId: query.branchId }));
  }

  if (query.departmentId) {
    filters.push(buildExactFilter({ departmentId: query.departmentId }));
  }

  if (query.type) {
    filters.push(buildExactFilter({ type: query.type }));
  }

  if (query.search) {
    filters.push(buildSearchFilter(query.search, config.searchFields));
  }

  if (query.dateFrom || query.dateTo) {
    filters.push(buildDateRangeFilter({
      field: 'createdAt',
      from: query.dateFrom,
      to: query.dateTo,
    }));
  }

  return mergeFilters(...filters);
}

export const MasterDataQueryService = {
  async listPaginated(
    entityKey: MasterDataEntityKey,
    companyId: string,
    query: MasterDataListQuery,
  ): Promise<PaginatedResult<BaseDocument>> {
    const config = resolveEntityConfig(entityKey);
    const filter = buildListFilter(entityKey, query);

    return config.repository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      companyId,
      includeDeleted: query.includeDeleted,
    });
  },

  async listCursor(
    entityKey: MasterDataEntityKey,
    companyId: string,
    query: MasterDataListQuery,
  ): Promise<CursorPaginationResult<BaseDocument>> {
    const config = resolveEntityConfig(entityKey);
    const limit = resolveCursorLimit(query.limit ?? query.pageSize);
    const sortOrder = query.sortOrder ?? 'desc';
    const cursorField = query.sortBy ?? 'id';

    const filter = mergeFilters(
      buildListFilter(entityKey, query),
      buildCursorFilter({ cursor: query.cursor, cursorField, sortOrder }),
    );

    const items = await config.repository.findMany(filter, {
      companyId,
      includeDeleted: query.includeDeleted,
    });

    const sorted = items
      .sort((a, b) => {
        const aVal = JSON.stringify((a as unknown as Record<string, unknown>)[cursorField] ?? '');
        const bVal = JSON.stringify((b as unknown as Record<string, unknown>)[cursorField] ?? '');
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      })
      .slice(0, limit + 1);

    const hasMore = sorted.length > limit;
    const pageItems = hasMore ? sorted.slice(0, limit) : sorted;

    return {
      items: pageItems,
      nextCursor: hasMore ? extractNextCursor(pageItems as unknown as Record<string, unknown>[], cursorField) : null,
      hasMore,
    };
  },

  async enrichDepartmentEmployeeCount(
    items: BaseDocument[],
    companyId: string,
  ): Promise<Array<BaseDocument & { employeeCount: number }>> {
    const enriched = await Promise.all(
      items.map(async (item) => {
        const count = await EmployeeRepository.count(
          { departmentId: item.id },
          { companyId },
        );
        return { ...item, employeeCount: count };
      }),
    );
    return enriched;
  },

  shouldEnrichEmployeeCount(entityKey: MasterDataEntityKey): boolean {
    return entityKey === MASTER_DATA_ENTITY.DEPARTMENT;
  },
};
