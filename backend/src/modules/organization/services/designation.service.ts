import type { DesignationDocument } from '@domain/organization/organization.schemas.js';
import {
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import { SalaryGradeRepository } from '@domain/master-data/master-data.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { MasterDataListQuery } from '@modules/organization/shared/master-data-query.service.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { buildExactFilter, mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import { documentToRecord } from '@shared/utils/document.util.js';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import {
  getHierarchyLevelLabel,
} from '@modules/organization/constants/designation.constants.js';

export interface DesignationListEnrichment {
  departmentName?: string;
  salaryGradeName?: string;
  applicableJobRoleNames: string[];
  applicableJobRoles: Array<{ id: string; name: string; fullTitle: string }>;
  employeeCount: number;
  hierarchyLevelLabel?: string;
}

export interface DesignationDetailResponse extends DesignationDocument {
  departmentName?: string;
  salaryGradeName?: string;
  hierarchyLevelLabel?: string;
  promotionDesignationName?: string;
  applicableJobRoles: Array<{ id: string; name: string; code: string; fullTitle: string }>;
  employees: Array<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    jobRoleId?: string;
    fullTitle: string;
  }>;
  auditHistory: Array<Record<string, unknown>>;
}

function buildDesignationListFilter(query: MasterDataListQuery): DomainQueryFilter {
  const filters: DomainQueryFilter[] = [];

  if (query.status) {
    filters.push(buildExactFilter({ status: query.status }));
  }

  if (query.departmentId) {
    filters.push(buildExactFilter({ departmentIds: query.departmentId }));
  }

  if (query.salaryGradeId) {
    filters.push(buildExactFilter({ salaryGradeId: query.salaryGradeId }));
  }

  if (query.hierarchyLevel !== undefined) {
    filters.push(buildExactFilter({ hierarchyLevel: query.hierarchyLevel }));
  }

  return mergeFilters(...filters);
}

async function enrichDesignationRecords(
  companyId: string,
  items: DesignationDocument[],
): Promise<Array<DesignationDocument & DesignationListEnrichment>> {
  const departmentIds = new Set<string>();
  const salaryGradeIds = new Set<string>();

  for (const item of items) {
    for (const deptId of item.departmentIds ?? []) {
      departmentIds.add(deptId);
    }
    if (item.salaryGradeId) salaryGradeIds.add(item.salaryGradeId);
  }

  const [departments, salaryGrades] = await Promise.all([
    departmentIds.size > 0
      ? DepartmentRepository.findMany({ id: { $in: [...departmentIds] } }, { companyId })
      : Promise.resolve([]),
    salaryGradeIds.size > 0
      ? SalaryGradeRepository.findMany({ id: { $in: [...salaryGradeIds] } }, { companyId })
      : Promise.resolve([]),
  ]);

  const departmentMap = new Map(departments.map((department) => [department.id, department.name]));
  const salaryGradeMap = new Map(salaryGrades.map((grade) => [grade.id, grade.name]));

  return Promise.all(
    items.map(async (item) => {
      const employeeCount = await EmployeeRepository.count({ designationId: item.id }, { companyId });

      return {
        ...documentToRecord(item),
        departmentName: (item.departmentIds ?? []).map((id) => departmentMap.get(id)).filter(Boolean).join(', '),
        salaryGradeName: item.salaryGradeId ? salaryGradeMap.get(item.salaryGradeId) : undefined,
        applicableJobRoleNames: [],
        applicableJobRoles: [],
        employeeCount,
        hierarchyLevelLabel:
          item.hierarchyLevel !== undefined ? getHierarchyLevelLabel(item.hierarchyLevel) : undefined,
      } as unknown as DesignationDocument & DesignationListEnrichment;
    }),
  );
}

export const DesignationService = {
  async list(
    companyId: string,
    query: MasterDataListQuery,
  ): Promise<PaginatedResult<DesignationDocument & DesignationListEnrichment>> {
    const filters: DomainQueryFilter[] = [buildDesignationListFilter(query)];

    if (query.search) {
      filters.push(buildSearchFilter(query.search, ['name', 'code', 'description']));
    }

    const filter = mergeFilters(...filters);

    const result = await DesignationRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'hierarchyLevel',
      sortOrder: query.sortOrder ?? 'asc',
      companyId,
      includeDeleted: query.includeDeleted,
    });

    return {
      ...result,
      items: await enrichDesignationRecords(companyId, result.items as DesignationDocument[]),
    };
  },

  async getDetail(companyId: string, id: string): Promise<DesignationDetailResponse> {
    const designation = await DesignationRepository.findById(id, { companyId });
    if (!designation) {
      throw new NotFoundError('Designation not found', ERROR_CODES.NOT_FOUND);
    }

    const [departments, salaryGrade, promotion, employees, auditHistory] = await Promise.all([
      (designation.departmentIds ?? []).length > 0
        ? DepartmentRepository.findMany({ id: { $in: designation.departmentIds } }, { companyId })
        : Promise.resolve([]),
      designation.salaryGradeId
        ? SalaryGradeRepository.findById(designation.salaryGradeId, { companyId })
        : Promise.resolve(null),
      designation.promotionDesignationId
        ? DesignationRepository.findById(designation.promotionDesignationId, { companyId })
        : Promise.resolve(null),
      EmployeeRepository.findMany({ designationId: id }, { companyId }),
      AuditLogRepository.paginate(
        { entityType: 'designation', entityId: id },
        { page: 1, pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc', companyId },
        { companyId },
      ),
    ]);

    return {
      ...documentToRecord(designation),
      departmentName: departments.map((d) => d.name).join(', '),
      salaryGradeName: salaryGrade?.name,
      hierarchyLevelLabel:
        designation.hierarchyLevel !== undefined
          ? getHierarchyLevelLabel(designation.hierarchyLevel)
          : undefined,
      promotionDesignationName: promotion?.name,
      applicableJobRoles: [],
      employees: employees.map((employee) => {
        return {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          status: employee.status,
          fullTitle: designation.name,
        };
      }),
      auditHistory: auditHistory.items.map((entry) => ({
        id: entry.id,
        action: entry.action,
        userId: entry.userId,
        createdAt: entry.createdAt,
        changes: entry.changes,
      })),
    } as unknown as DesignationDetailResponse;
  },
};
