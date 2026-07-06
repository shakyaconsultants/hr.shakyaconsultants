import {
  EmployeeDocument,
  EmployeeRepository,
  REPORTING_RELATIONSHIP_TYPE,
  ReportingHierarchyRepository,
} from '@domain/employee/employee.schemas.js';
import {
  DepartmentRepository,
  DesignationRepository,
  BranchRepository,
} from '@domain/organization/organization.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { WorkforceScopeService } from '@modules/employee/services/workforce-scope.service.js';

const DIRECT_TYPES = new Set([
  REPORTING_RELATIONSHIP_TYPE.DIRECT,
  REPORTING_RELATIONSHIP_TYPE.MANAGER,
]);

export interface ReportingPersonView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  designationId?: string;
  designationName?: string;
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;
}

export interface ReportingRelationshipView {
  id: string;
  employeeId: string;
  managerId: string;
  relationshipType: string;
  isPrimary: boolean;
  effectiveFrom: Date;
  manager?: ReportingPersonView;
}

export interface ReportingChartNode extends ReportingPersonView {
  directReports: ReportingChartNode[];
}

type EnrichableEmployee = Pick<
  EmployeeDocument,
  'id' | 'firstName' | 'lastName' | 'email' | 'photoUrl' | 'departmentId' | 'designationId'
> & { jobTitle?: string };

async function enrichEmployees(companyId: string, employees: EnrichableEmployee[]) {
  const departmentIds = new Set<string>();
  const designationIds = new Set<string>();

  for (const employee of employees) {
    if (employee.departmentId) departmentIds.add(employee.departmentId);
    if (employee.designationId) designationIds.add(employee.designationId);
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

  return employees.map((employee) => ({
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    photoUrl: employee.photoUrl,
    designationId: employee.designationId,
    designationName: designationMap.get(employee.designationId),
    departmentId: employee.departmentId,
    departmentName: departmentMap.get(employee.departmentId),
    jobTitle: employee.jobTitle,
  })) satisfies ReportingPersonView[];
}

function toPersonView(employee: ReportingPersonView): ReportingPersonView {
  return { ...employee };
}

export interface DirectReportView extends ReportingPersonView {
  relationshipId: string;
  relationshipType: string;
}

export const EmployeeReportingService = {
  async listManagersEnriched(
    companyId: string,
    employeeId: string,
  ): Promise<ReportingRelationshipView[]> {
    const relationships = await ReportingHierarchyRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );

    if (relationships.length === 0) {
      return [];
    }

    const managerIds = [...new Set(relationships.map((r) => r.managerId))];
    const managers = await EmployeeRepository.findMany({ id: { $in: managerIds } }, { companyId });
    const managerViews = await enrichEmployees(companyId, managers);
    const managerMap = new Map(managerViews.map((m) => [m.id, m]));

    return relationships.map((rel) => ({
      id: rel.id,
      employeeId: rel.employeeId,
      managerId: rel.managerId,
      relationshipType: rel.relationshipType,
      isPrimary: rel.isPrimary,
      effectiveFrom: rel.effectiveFrom,
      manager: managerMap.get(rel.managerId),
    }));
  },

  async listDirectReportsEnriched(
    companyId: string,
    managerId: string,
  ): Promise<DirectReportView[]> {
    const relationships = await ReportingHierarchyRepository.findMany(
      {
        managerId,
        relationshipType: { $in: [...DIRECT_TYPES] },
        effectiveTo: null,
      },
      { companyId },
    );

    if (relationships.length === 0) {
      return [];
    }

    const reportIds = [...new Set(relationships.map((r) => r.employeeId))];
    const employees = await EmployeeRepository.findMany({ id: { $in: reportIds } }, { companyId });
    const personViews = await enrichEmployees(companyId, employees);
    const personMap = new Map(personViews.map((p) => [p.id, p]));

    const results: DirectReportView[] = [];
    for (const rel of relationships) {
      const person = personMap.get(rel.employeeId);
      if (!person) continue;
      results.push({
        ...person,
        relationshipId: rel.id,
        relationshipType: rel.relationshipType,
      });
    }
    return results;
  },

  async getReportingTree(companyId: string, companyName: string) {
    const [allEmployees, relationships, departments, branches] = await Promise.all([
      EmployeeRepository.findMany(
        { status: { $ne: ENTITY_STATUS.ARCHIVED }, isDeleted: { $ne: true } },
        { companyId },
      ),
      ReportingHierarchyRepository.findMany(
        {
          relationshipType: { $in: [...DIRECT_TYPES] },
          $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }],
        },
        { companyId },
      ),
      DepartmentRepository.findMany({ status: { $ne: ENTITY_STATUS.ARCHIVED } }, { companyId }),
      BranchRepository.findMany({ status: { $ne: ENTITY_STATUS.ARCHIVED } }, { companyId }),
    ]);

    const employees = await WorkforceScopeService.filterWorkforceEmployees(companyId, allEmployees);
    const workforceIds = new Set(employees.map((employee) => employee.id));

    const personViews = await enrichEmployees(companyId, employees);
    const personMap = new Map(personViews.map((p) => [p.id, p]));
    const deptById = new Map(departments.map((dept) => [dept.id, dept]));
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));

    const managerByEmployee = new Map<string, string>();

    for (const rel of relationships) {
      if (!workforceIds.has(rel.employeeId) || !workforceIds.has(rel.managerId)) {
        continue;
      }
      if (rel.isPrimary || !managerByEmployee.has(rel.employeeId)) {
        managerByEmployee.set(rel.employeeId, rel.managerId);
      }
    }

    for (const employee of employees) {
      if (
        employee.reportingManagerId &&
        workforceIds.has(employee.reportingManagerId) &&
        !managerByEmployee.has(employee.id)
      ) {
        managerByEmployee.set(employee.id, employee.reportingManagerId);
      }
    }

    function resolveBranchId(employee: (typeof employees)[number]): string | undefined {
      if (employee.branchId) return employee.branchId;
      if (employee.departmentId) {
        const dept = deptById.get(employee.departmentId);
        if (dept?.branchId) return dept.branchId;
      }
      return undefined;
    }

    for (const employee of employees) {
      if (managerByEmployee.has(employee.id)) continue;

      let inferredManager: string | undefined;
      if (employee.departmentId) {
        const dept = deptById.get(employee.departmentId);
        const headId = dept?.headEmployeeId;
        if (headId && headId !== employee.id && personMap.has(headId)) {
          inferredManager = headId;
        }
      }

      if (!inferredManager) {
        const branchId = resolveBranchId(employee);
        if (branchId) {
          const branch = branchById.get(branchId);
          const branchManagerId = branch?.branchManagerId;
          if (
            branchManagerId &&
            branchManagerId !== employee.id &&
            personMap.has(branchManagerId)
          ) {
            inferredManager = branchManagerId;
          }
        }
      }

      if (inferredManager) {
        managerByEmployee.set(employee.id, inferredManager);
      }
    }

    const branchManagerIds = branches
      .map((branch) => branch.branchManagerId)
      .filter((id): id is string => Boolean(id && workforceIds.has(id)));

    let companyRootId =
      branchManagerIds.find((id) => !managerByEmployee.has(id)) ?? branchManagerIds[0];

    if (!companyRootId) {
      const deptHeadIds = departments
        .map((dept) => dept.headEmployeeId)
        .filter((id): id is string => Boolean(id && workforceIds.has(id)));
      companyRootId = deptHeadIds.find((id) => !managerByEmployee.has(id)) ?? deptHeadIds[0];
    }

    if (companyRootId) {
      for (const branch of branches) {
        const branchManagerId = branch.branchManagerId;
        if (
          branchManagerId &&
          branchManagerId !== companyRootId &&
          !managerByEmployee.has(branchManagerId) &&
          workforceIds.has(branchManagerId) &&
          workforceIds.has(companyRootId)
        ) {
          managerByEmployee.set(branchManagerId, companyRootId);
        }
      }

      for (const employee of employees) {
        if (managerByEmployee.has(employee.id) || employee.id === companyRootId) {
          continue;
        }
        managerByEmployee.set(employee.id, companyRootId);
      }
    }

    const childrenByManager = new Map<string, string[]>();
    for (const [employeeId, managerId] of managerByEmployee) {
      if (employeeId === managerId) continue;
      const list = childrenByManager.get(managerId) ?? [];
      list.push(employeeId);
      childrenByManager.set(managerId, list);
    }

    const hasManager = new Set(managerByEmployee.keys());

    function buildNode(employeeId: string, visited: Set<string>): ReportingChartNode | null {
      if (visited.has(employeeId)) return null;
      const person = personMap.get(employeeId);
      if (!person) return null;

      const nextVisited = new Set(visited);
      nextVisited.add(employeeId);

      const childIds = childrenByManager.get(employeeId) ?? [];
      const directReports = childIds
        .map((id) => buildNode(id, nextVisited))
        .filter((node): node is ReportingChartNode => node !== null)
        .sort(
          (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
        );

      return { ...toPersonView(person), directReports };
    }

    const rootIds = companyRootId
      ? [companyRootId]
      : personViews.map((p) => p.id).filter((id) => !hasManager.has(id));

    const roots = rootIds
      .map((id) => buildNode(id, new Set()))
      .filter((node): node is ReportingChartNode => node !== null)
      .sort(
        (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
      );

    return {
      companyName,
      roots,
      stats: {
        employees: personViews.length,
        withManager: hasManager.size,
        roots: roots.length,
      },
    };
  },
};
