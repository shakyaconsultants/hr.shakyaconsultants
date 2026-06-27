import type { DepartmentDocument } from '@domain/organization/organization.schemas.js';
import {
  BranchRepository,
  DepartmentRepository,
  JobRoleRepository,
} from '@domain/organization/organization.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ProjectRepository } from '@domain/project/project.schemas.js';
import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { MasterDataListQuery } from '@modules/organization/shared/master-data-query.service.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { buildExactFilter, mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';

export interface DepartmentListEnrichment {
  branchName?: string;
  headEmployeeName?: string;
  parentDepartmentName?: string;
  employeeCount: number;
}

export interface DepartmentStats {
  employees: number;
  managers: number;
  projects: number;
  openPositions: number;
}

export interface DepartmentDetailResponse extends DepartmentDocument {
  branchName?: string;
  headEmployeeName?: string;
  headEmployeeNumber?: string;
  parentDepartmentName?: string;
  employeeCount: number;
  stats: DepartmentStats;
  hierarchy: {
    ancestors: Array<{ id: string; name: string; code: string }>;
    children: Array<{ id: string; name: string; code: string; status: string }>;
  };
  employees: Array<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  }>;
  jobRoles: Array<{ id: string; name: string; code: string; status: string }>;
  projects: Array<{ id: string; name: string; code: string; status: string }>;
  auditHistory: Array<Record<string, unknown>>;
}

async function buildDepartmentSearchFilter(companyId: string, search: string): Promise<DomainQueryFilter> {
  const textFilter = buildSearchFilter(search, ['name', 'code', 'description', 'email']);

  const branches = await BranchRepository.findMany(
    buildSearchFilter(search, ['name', 'code']),
    { companyId, includeDeleted: false },
  );
  const branchIds = branches.map((branch) => branch.id);

  const employees = await EmployeeRepository.findMany(
    buildSearchFilter(search, ['firstName', 'lastName', 'employeeNumber', 'email']),
    { companyId, includeDeleted: false },
  );
  const headIds = employees.map((employee) => employee.id);

  const orConditions: DomainQueryFilter[] = [textFilter];
  if (branchIds.length > 0) {
    orConditions.push({ branchId: { $in: branchIds } });
  }
  if (headIds.length > 0) {
    orConditions.push({ headEmployeeId: { $in: headIds } });
  }

  return { $or: orConditions };
}

function buildDepartmentListFilter(query: MasterDataListQuery): DomainQueryFilter {
  const filters: DomainQueryFilter[] = [];

  if (query.status) {
    filters.push(buildExactFilter({ status: query.status }));
  }

  if (query.branchId) {
    filters.push(buildExactFilter({ branchId: query.branchId }));
  }

  if (query.parentDepartmentId === 'root') {
    filters.push({
      $or: [{ parentDepartmentId: { $exists: false } }, { parentDepartmentId: null }, { parentDepartmentId: '' }],
    });
  } else if (query.parentDepartmentId) {
    filters.push(buildExactFilter({ parentDepartmentId: query.parentDepartmentId }));
  }

  if (query.headEmployeeId) {
    filters.push(buildExactFilter({ headEmployeeId: query.headEmployeeId }));
  }

  return mergeFilters(...filters);
}

async function enrichDepartmentRecords(
  companyId: string,
  items: DepartmentDocument[],
): Promise<Array<DepartmentDocument & DepartmentListEnrichment>> {
  const branchIds = new Set<string>();
  const parentIds = new Set<string>();
  const headIds = new Set<string>();

  for (const item of items) {
    if (item.branchId) branchIds.add(item.branchId);
    if (item.parentDepartmentId) parentIds.add(item.parentDepartmentId);
    if (item.headEmployeeId) headIds.add(item.headEmployeeId);
  }

  const [branches, parents, heads] = await Promise.all([
    branchIds.size > 0
      ? BranchRepository.findMany({ id: { $in: [...branchIds] } }, { companyId })
      : Promise.resolve([]),
    parentIds.size > 0
      ? DepartmentRepository.findMany({ id: { $in: [...parentIds] } }, { companyId })
      : Promise.resolve([]),
    headIds.size > 0
      ? EmployeeRepository.findMany({ id: { $in: [...headIds] } }, { companyId })
      : Promise.resolve([]),
  ]);

  const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));
  const parentMap = new Map(parents.map((parent) => [parent.id, parent.name]));
  const headMap = new Map(
    heads.map((head) => [head.id, `${head.firstName} ${head.lastName}`.trim()]),
  );

  return Promise.all(
    items.map(async (item) => {
      const employeeCount = await EmployeeRepository.count({ departmentId: item.id }, { companyId });
      return {
        ...item,
        branchName: item.branchId ? branchMap.get(item.branchId) : undefined,
        headEmployeeName: item.headEmployeeId ? headMap.get(item.headEmployeeId) : undefined,
        parentDepartmentName: item.parentDepartmentId ? parentMap.get(item.parentDepartmentId) : undefined,
        employeeCount,
      };
    }),
  );
}

export const DepartmentService = {
  async list(
    companyId: string,
    query: MasterDataListQuery,
  ): Promise<PaginatedResult<DepartmentDocument & DepartmentListEnrichment>> {
    const filters: DomainQueryFilter[] = [buildDepartmentListFilter(query)];

    if (query.search) {
      filters.push(await buildDepartmentSearchFilter(companyId, query.search));
    }

    const filter = mergeFilters(...filters);

    const result = await DepartmentRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'name',
      sortOrder: query.sortOrder ?? 'asc',
      companyId,
      includeDeleted: query.includeDeleted,
    });

    return {
      ...result,
      items: await enrichDepartmentRecords(companyId, result.items as DepartmentDocument[]),
    };
  },

  async getCompanyStats(companyId: string): Promise<DepartmentStats> {
    const [employees, departments, projects, jobRoles] = await Promise.all([
      EmployeeRepository.count({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
      DepartmentRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
      ProjectRepository.count({ isArchived: { $ne: true } }, { companyId }),
      JobRoleRepository.count({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
    ]);

    const uniqueHeads = new Set(
      departments
        .map((department) => department.headEmployeeId)
        .filter((headId): headId is string => typeof headId === 'string' && headId.length > 0),
    );

    return {
      employees,
      managers: uniqueHeads.size,
      projects,
      openPositions: jobRoles,
    };
  },

  async getDetail(companyId: string, id: string): Promise<DepartmentDetailResponse> {
    const department = await DepartmentRepository.findById(id, { companyId });
    if (!department) {
      throw new NotFoundError('Department not found', ERROR_CODES.NOT_FOUND);
    }

    const [branch, parent, head, employees, jobRoles, projects, auditHistory] = await Promise.all([
      department.branchId ? BranchRepository.findById(department.branchId, { companyId }) : Promise.resolve(null),
      department.parentDepartmentId
        ? DepartmentRepository.findById(department.parentDepartmentId, { companyId })
        : Promise.resolve(null),
      department.headEmployeeId
        ? EmployeeRepository.findById(department.headEmployeeId, { companyId })
        : Promise.resolve(null),
      EmployeeRepository.findMany({ departmentId: id }, { companyId }),
      JobRoleRepository.findMany({ departmentId: id }, { companyId }),
      ProjectRepository.findMany({ departmentId: id }, { companyId }),
      AuditLogRepository.paginate(
        { entityType: 'department', entityId: id },
        { page: 1, pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc', companyId },
        { companyId },
      ),
    ]);

    const children = await DepartmentRepository.findMany({ parentDepartmentId: id }, { companyId });

    const ancestors: Array<{ id: string; name: string; code: string }> = [];
    let currentParentId = department.parentDepartmentId;
    let depth = 0;

    while (currentParentId && depth < 50) {
      const ancestor = await DepartmentRepository.findById(currentParentId, { companyId });
      if (!ancestor) {
        break;
      }
      ancestors.unshift({ id: ancestor.id, name: ancestor.name, code: ancestor.code });
      currentParentId = ancestor.parentDepartmentId;
      depth += 1;
    }

    const uniqueHeads = new Set(
      [department.headEmployeeId, ...children.map((child) => child.headEmployeeId)].filter(Boolean),
    );

    return {
      ...department,
      branchName: branch?.name,
      parentDepartmentName: parent?.name,
      headEmployeeName: head ? `${head.firstName} ${head.lastName}`.trim() : undefined,
      headEmployeeNumber: head?.employeeNumber,
      employeeCount: employees.length,
      stats: {
        employees: employees.length,
        managers: uniqueHeads.size,
        projects: projects.length,
        openPositions: jobRoles.filter((role) => role.status === ENTITY_STATUS.ACTIVE).length,
      },
      hierarchy: {
        ancestors,
        children: children.map((child) => ({
          id: child.id,
          name: child.name,
          code: child.code,
          status: child.status,
        })),
      },
      employees: employees.map((employee) => ({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        status: employee.status,
      })),
      jobRoles: jobRoles.map((role) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        status: role.status,
      })),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
      })),
      auditHistory: auditHistory.items.map((entry) => ({
        id: entry.id,
        action: entry.action,
        userId: entry.userId,
        createdAt: entry.createdAt,
        changes: entry.changes,
      })),
    };
  },
};
