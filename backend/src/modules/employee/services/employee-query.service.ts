import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import {
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { buildExactFilter, mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { EmployeeListQuery } from '@modules/employee/types/employee.types.js';
import { WorkforceScopeService } from '@modules/employee/services/workforce-scope.service.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

const SEARCH_FIELDS = ['firstName', 'lastName', 'employeeNumber', 'email', 'phone'];

export type EnrichedEmployeeRecord = EmployeeDocument & {
  departmentName?: string;
  designationName?: string;
};

function toPlainEmployee(item: EmployeeDocument): EmployeeDocument {
  const maybeDoc = item as EmployeeDocument & { toObject?: () => EmployeeDocument };
  if (typeof maybeDoc.toObject === 'function') {
    return maybeDoc.toObject();
  }
  return item;
}

export async function enrichEmployeeRecords(
  companyId: string,
  items: EmployeeDocument[],
): Promise<EnrichedEmployeeRecord[]> {
  const departmentIds = new Set<string>();
  const designationIds = new Set<string>();

  for (const item of items) {
    if (item.departmentId) departmentIds.add(item.departmentId);
    if (item.designationId) designationIds.add(item.designationId);
  }

  const [departments, designations] = await Promise.all([
    departmentIds.size > 0
      ? DepartmentRepository.findMany({ id: { $in: [...departmentIds] } }, { companyId })
      : Promise.resolve([]),
    designationIds.size > 0
      ? DesignationRepository.findMany({ id: { $in: [...designationIds] } }, { companyId })
      : Promise.resolve([]),
  ]);

  const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
  const designationMap = new Map(designations.map((d) => [d.id, d.name]));

  return items.map((item) => {
    const raw = toPlainEmployee(item);
    return {
      ...raw,
      departmentName: departmentMap.get(item.departmentId),
      designationName: designationMap.get(item.designationId),
    };
  });
}

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

async function applyWorkforceScope(
  companyId: string,
  filter: DomainQueryFilter,
): Promise<DomainQueryFilter> {
  const excluded = await WorkforceScopeService.getSystemOperatorEmployeeIds(companyId);
  if (excluded.size === 0) {
    return filter;
  }
  return mergeFilters(filter, { id: { $nin: [...excluded] } });
}

export const EmployeeQueryService = {
  async list(
    companyId: string,
    query: EmployeeListQuery,
  ): Promise<PaginatedResult<EnrichedEmployeeRecord>> {
    const filter = await applyWorkforceScope(companyId, buildEmployeeFilter(query));
    const result = await EmployeeRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'lastName',
      sortOrder: query.sortOrder ?? 'asc',
      companyId,
      includeDeleted: query.includeDeleted,
    });
    return {
      ...result,
      items: await enrichEmployeeRecords(companyId, result.items),
    };
  },

  async search(companyId: string, search: string, limit = 20): Promise<EnrichedEmployeeRecord[]> {
    const filter = await applyWorkforceScope(
      companyId,
      mergeFilters(buildSearchFilter(search, SEARCH_FIELDS)),
    );
    const results = await EmployeeRepository.findMany(filter, { companyId });
    const sliced = results.slice(0, limit);
    return enrichEmployeeRecords(companyId, sliced);
  },
};
