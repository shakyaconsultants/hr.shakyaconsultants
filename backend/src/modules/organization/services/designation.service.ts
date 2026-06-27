import type { DesignationDocument } from '@domain/organization/organization.schemas.js';
import {
  DepartmentRepository,
  DesignationRepository,
  JobRoleRepository,
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
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import {
  buildDesignationFullTitle,
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
    filters.push(buildExactFilter({ departmentId: query.departmentId }));
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
  const jobRoleIds = new Set<string>();

  for (const item of items) {
    if (item.departmentId) departmentIds.add(item.departmentId);
    if (item.salaryGradeId) salaryGradeIds.add(item.salaryGradeId);
    for (const roleId of item.applicableJobRoleIds ?? []) {
      jobRoleIds.add(roleId);
    }
  }

  const [departments, salaryGrades, jobRoles] = await Promise.all([
    departmentIds.size > 0
      ? DepartmentRepository.findMany({ id: { $in: [...departmentIds] } }, { companyId })
      : Promise.resolve([]),
    salaryGradeIds.size > 0
      ? SalaryGradeRepository.findMany({ id: { $in: [...salaryGradeIds] } }, { companyId })
      : Promise.resolve([]),
    jobRoleIds.size > 0
      ? JobRoleRepository.findMany({ id: { $in: [...jobRoleIds] } }, { companyId })
      : Promise.resolve([]),
  ]);

  const departmentMap = new Map(departments.map((department) => [department.id, department.name]));
  const salaryGradeMap = new Map(salaryGrades.map((grade) => [grade.id, grade.name]));
  const jobRoleMap = new Map(jobRoles.map((role) => [role.id, role]));

  return Promise.all(
    items.map(async (item) => {
      const employeeCount = await EmployeeRepository.count({ designationId: item.id }, { companyId });
      const applicableJobRoles = (item.applicableJobRoleIds ?? [])
        .map((roleId) => jobRoleMap.get(roleId))
        .filter(Boolean)
        .map((role) => ({
          id: role!.id,
          name: role!.name,
          fullTitle: buildDesignationFullTitle(item.name, role!.name),
        }));

      return {
        ...item,
        departmentName: item.departmentId ? departmentMap.get(item.departmentId) : undefined,
        salaryGradeName: item.salaryGradeId ? salaryGradeMap.get(item.salaryGradeId) : undefined,
        applicableJobRoleNames: applicableJobRoles.map((role) => role.name),
        applicableJobRoles,
        employeeCount,
        hierarchyLevelLabel:
          item.hierarchyLevel !== undefined ? getHierarchyLevelLabel(item.hierarchyLevel) : undefined,
      };
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

    const [department, salaryGrade, promotion, jobRoles, employees, auditHistory] = await Promise.all([
      designation.departmentId
        ? DepartmentRepository.findById(designation.departmentId, { companyId })
        : Promise.resolve(null),
      designation.salaryGradeId
        ? SalaryGradeRepository.findById(designation.salaryGradeId, { companyId })
        : Promise.resolve(null),
      designation.promotionDesignationId
        ? DesignationRepository.findById(designation.promotionDesignationId, { companyId })
        : Promise.resolve(null),
      (designation.applicableJobRoleIds ?? []).length > 0
        ? JobRoleRepository.findMany({ id: { $in: designation.applicableJobRoleIds } }, { companyId })
        : Promise.resolve([]),
      EmployeeRepository.findMany({ designationId: id }, { companyId }),
      AuditLogRepository.paginate(
        { entityType: 'designation', entityId: id },
        { page: 1, pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc', companyId },
        { companyId },
      ),
    ]);

    const jobRoleLookup = new Map(jobRoles.map((role) => [role.id, role]));

    return {
      ...designation,
      departmentName: department?.name,
      salaryGradeName: salaryGrade?.name,
      hierarchyLevelLabel:
        designation.hierarchyLevel !== undefined
          ? getHierarchyLevelLabel(designation.hierarchyLevel)
          : undefined,
      promotionDesignationName: promotion?.name,
      applicableJobRoles: jobRoles.map((role) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        fullTitle: buildDesignationFullTitle(designation.name, role.name),
      })),
      employees: await Promise.all(
        employees.map(async (employee) => {
          const role = employee.jobRoleId ? jobRoleLookup.get(employee.jobRoleId) : undefined;
          let fullTitle = buildDesignationFullTitle(designation.name, role?.name);
          if (!role && employee.jobRoleId) {
            const fetchedRole = await JobRoleRepository.findById(employee.jobRoleId, { companyId });
            fullTitle = buildDesignationFullTitle(designation.name, fetchedRole?.name);
          }
          return {
            id: employee.id,
            employeeNumber: employee.employeeNumber,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            status: employee.status,
            jobRoleId: employee.jobRoleId,
            fullTitle,
          };
        }),
      ),
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
