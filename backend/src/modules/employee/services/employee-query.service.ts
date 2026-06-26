import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { buildExactFilter, mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { EmployeeListQuery } from '@modules/employee/types/employee.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

const SEARCH_FIELDS = ['firstName', 'lastName', 'employeeNumber', 'email', 'phone'];

function buildEmployeeFilter(query: EmployeeListQuery): DomainQueryFilter {
  const filters: DomainQueryFilter[] = [];

  if (query.status) {
    filters.push(buildExactFilter({ status: query.status }));
  } else if (!query.includeArchived && !query.includeDeleted) {
    filters.push({ status: { $ne: ENTITY_STATUS.ARCHIVED } });
  }

  if (query.employmentStatus) {
    filters.push(buildExactFilter({ employmentStatus: query.employmentStatus }));
  }

  if (query.departmentId) {
    filters.push(buildExactFilter({ departmentId: query.departmentId }));
  }

  if (query.branchId) {
    filters.push(buildExactFilter({ branchId: query.branchId }));
  }

  if (query.designationId) {
    filters.push(buildExactFilter({ designationId: query.designationId }));
  }

  if (query.reportingManagerId) {
    filters.push(buildExactFilter({ reportingManagerId: query.reportingManagerId }));
  }

  if (query.search) {
    filters.push(buildSearchFilter(query.search, SEARCH_FIELDS));
  }

  return mergeFilters(...filters);
}

export const EmployeeQueryService = {
  async list(companyId: string, query: EmployeeListQuery): Promise<PaginatedResult<EmployeeDocument>> {
    const filter = buildEmployeeFilter(query);
    return EmployeeRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'lastName',
      sortOrder: query.sortOrder ?? 'asc',
      companyId,
      includeDeleted: query.includeDeleted,
    });
  },

  async search(companyId: string, search: string, limit = 20): Promise<EmployeeDocument[]> {
    const filter = mergeFilters(buildSearchFilter(search, SEARCH_FIELDS));
    const results = await EmployeeRepository.findMany(filter, { companyId });
    return results.slice(0, limit);
  },
};
