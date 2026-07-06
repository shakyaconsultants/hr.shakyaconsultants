import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import type {
  OrgChartBranch,
  OrgChartBuildInput,
  OrgChartDepartment,
  OrgChartEmployee,
  OrgChartTree,
} from '@/features/admin/components/org-chart/org-chart.types';

const UNASSIGNED_BRANCH_ID = '__unassigned__';
const UNASSIGNED_DEPT_ID = '__unassigned_dept__';
const SYSTEM_DEPARTMENT_CODE = 'ADMIN';
const SYSTEM_DESIGNATION_CODE = 'SYSADMIN';

function designationLevel(designation: Record<string, unknown>): number {
  return typeof designation.hierarchyLevel === 'number' ? designation.hierarchyLevel : 0;
}

function mapEmployee(
  employee: EmployeeRecord,
  designationMap: Map<string, Record<string, unknown>>,
): OrgChartEmployee {
  const designation = designationMap.get(employee.designationId);
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    photoUrl: employee.photoUrl,
    designationId: employee.designationId,
    designationName: String(designation?.name ?? 'Team member'),
    hierarchyLevel: designation ? designationLevel(designation) : 0,
  };
}

function sortEmployees(employees: OrgChartEmployee[]): OrgChartEmployee[] {
  return [...employees].sort(
    (a, b) => b.hierarchyLevel - a.hierarchyLevel || a.lastName.localeCompare(b.lastName),
  );
}

function isSystemOperatorEmployee(
  employee: EmployeeRecord,
  designationMap: Map<string, Record<string, unknown>>,
  departmentMap: Map<string, Record<string, unknown>>,
): boolean {
  if (employee.employeeNumber?.startsWith('__SYS__')) {
    return true;
  }

  const department = employee.departmentId
    ? departmentMap.get(String(employee.departmentId))
    : undefined;
  const designation = employee.designationId
    ? designationMap.get(String(employee.designationId))
    : undefined;

  return (
    String(department?.code ?? '').toUpperCase() === SYSTEM_DEPARTMENT_CODE &&
    String(designation?.code ?? '').toUpperCase() === SYSTEM_DESIGNATION_CODE
  );
}

function isSystemDepartment(department: Record<string, unknown>): boolean {
  return String(department.code ?? '').toUpperCase() === SYSTEM_DEPARTMENT_CODE;
}

function resolveEmployeeBranchId(
  employee: EmployeeRecord,
  departmentMap: Map<string, Record<string, unknown>>,
): string {
  if (employee.branchId) {
    return String(employee.branchId);
  }
  if (employee.departmentId) {
    const department = departmentMap.get(String(employee.departmentId));
    if (department?.branchId) {
      return String(department.branchId);
    }
  }
  return UNASSIGNED_BRANCH_ID;
}

function buildDepartmentNode(
  department: Record<string, unknown>,
  branchEmployees: EmployeeRecord[],
  designationMap: Map<string, Record<string, unknown>>,
): OrgChartDepartment {
  const departmentId = String(department.id);
  const headEmployeeId = department.headEmployeeId ? String(department.headEmployeeId) : undefined;

  const membersInDept = branchEmployees.filter(
    (employee) => String(employee.departmentId) === departmentId,
  );
  const headRecord = headEmployeeId
    ? membersInDept.find((employee) => employee.id === headEmployeeId)
    : undefined;
  const otherMembers = membersInDept.filter((employee) => employee.id !== headEmployeeId);

  const head = headRecord ? mapEmployee(headRecord, designationMap) : undefined;
  const members = sortEmployees(
    otherMembers.map((employee) => mapEmployee(employee, designationMap)),
  );

  return {
    id: departmentId,
    name: String(department.name ?? 'Department'),
    code: String(department.code ?? ''),
    employeeCount: (head ? 1 : 0) + members.length,
    head,
    members,
  };
}

function buildBranchNode(
  branch: Record<string, unknown>,
  departments: Record<string, unknown>[],
  employees: EmployeeRecord[],
  designationMap: Map<string, Record<string, unknown>>,
  departmentMap: Map<string, Record<string, unknown>>,
): OrgChartBranch {
  const branchId = String(branch.id);
  const branchEmployees = employees.filter(
    (employee) => resolveEmployeeBranchId(employee, departmentMap) === branchId,
  );

  const branchDepartments = departments.filter(
    (department) =>
      !isSystemDepartment(department) &&
      (String(department.branchId ?? UNASSIGNED_BRANCH_ID) === branchId ||
        (branchId === UNASSIGNED_BRANCH_ID && !department.branchId)),
  );

  const departmentNodes = branchDepartments
    .map((department) => buildDepartmentNode(department, branchEmployees, designationMap))
    .filter((department) => department.employeeCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const employeesWithoutDepartment = branchEmployees.filter((employee) => !employee.departmentId);
  if (employeesWithoutDepartment.length > 0) {
    departmentNodes.push({
      id: `${branchId}-${UNASSIGNED_DEPT_ID}`,
      name: 'Unassigned',
      code: 'UNASSIGNED',
      employeeCount: employeesWithoutDepartment.length,
      members: sortEmployees(
        employeesWithoutDepartment.map((employee) => mapEmployee(employee, designationMap)),
      ),
    });
  }

  const branchManagerId = branch.branchManagerId ? String(branch.branchManagerId) : undefined;
  const branchHeadRecord = branchManagerId
    ? employees.find((employee) => employee.id === branchManagerId)
    : undefined;
  const branchHead = branchHeadRecord ? mapEmployee(branchHeadRecord, designationMap) : undefined;

  const branchHeadAlreadyInDept =
    branchHead &&
    departmentNodes.some(
      (dept) =>
        dept.head?.id === branchHead.id ||
        dept.members.some((member) => member.id === branchHead.id),
    );

  const employeeCount =
    departmentNodes.reduce((sum, department) => sum + department.employeeCount, 0) +
    (branchHead && !branchHeadAlreadyInDept ? 1 : 0);

  return {
    id: branchId,
    name: String(branch.name ?? 'Branch'),
    code: String(branch.code ?? ''),
    branchHead: branchHeadAlreadyInDept ? undefined : branchHead,
    departments: departmentNodes,
    employeeCount,
  };
}

export function buildOrgChartTree(input: OrgChartBuildInput): OrgChartTree {
  const { company, branches, departments, designations, employees } = input;
  const designationMap = new Map(designations.map((item) => [String(item.id), item]));
  const departmentMap = new Map(departments.map((item) => [String(item.id), item]));

  const workforceEmployees = employees
    .filter((employee) => employee.status !== 'archived')
    .filter((employee) => !isSystemOperatorEmployee(employee, designationMap, departmentMap));

  const workforceDepartments = departments.filter((department) => !isSystemDepartment(department));

  const branchRecords = branches.length > 0 ? branches : [];
  const chartBranches: OrgChartBranch[] = [];

  for (const branch of branchRecords) {
    const node = buildBranchNode(
      branch,
      workforceDepartments,
      workforceEmployees,
      designationMap,
      departmentMap,
    );
    if (node.employeeCount > 0 || node.departments.length > 0) {
      chartBranches.push(node);
    }
  }

  const unassignedBranchEmployees = workforceEmployees.filter(
    (employee) => resolveEmployeeBranchId(employee, departmentMap) === UNASSIGNED_BRANCH_ID,
  );
  if (unassignedBranchEmployees.length > 0 && branchRecords.length === 0) {
    chartBranches.push(
      buildBranchNode(
        { id: UNASSIGNED_BRANCH_ID, name: 'Head Office', code: 'HQ' },
        workforceDepartments.filter((department) => !department.branchId),
        workforceEmployees,
        designationMap,
        departmentMap,
      ),
    );
  } else if (unassignedBranchEmployees.length > 0) {
    const existing = chartBranches.find((branch) => branch.id === UNASSIGNED_BRANCH_ID);
    if (!existing) {
      chartBranches.push(
        buildBranchNode(
          { id: UNASSIGNED_BRANCH_ID, name: 'Unassigned Location', code: 'UNASSIGNED' },
          [],
          workforceEmployees,
          designationMap,
          departmentMap,
        ),
      );
    }
  }

  if (chartBranches.length === 0 && workforceDepartments.length > 0) {
    chartBranches.push(
      buildBranchNode(
        {
          id: 'company-wide',
          name: String(company?.name ?? 'Company'),
          code: String(company?.code ?? 'ALL'),
        },
        workforceDepartments,
        workforceEmployees,
        designationMap,
        departmentMap,
      ),
    );
  }

  chartBranches.sort((a, b) => {
    if (a.code.toUpperCase() === 'HQ') return -1;
    if (b.code.toUpperCase() === 'HQ') return 1;
    return a.name.localeCompare(b.name);
  });

  const totalDepartments = chartBranches.reduce(
    (sum, branch) => sum + branch.departments.length,
    0,
  );

  return {
    companyName: String(company?.name ?? 'Company'),
    companyCode: String(company?.code ?? ''),
    branches: chartBranches,
    stats: {
      branches: chartBranches.length,
      departments: totalDepartments,
      employees: workforceEmployees.length,
    },
  };
}

function departmentMatchesQuery(department: OrgChartDepartment, query: string): boolean {
  return (
    department.name.toLowerCase().includes(query) || department.code.toLowerCase().includes(query)
  );
}

function employeeMatchesQuery(employee: OrgChartEmployee, query: string): boolean {
  const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
  return (
    fullName.includes(query) ||
    employee.email.toLowerCase().includes(query) ||
    employee.designationName.toLowerCase().includes(query)
  );
}

export function filterOrgChartTree(tree: OrgChartTree, query: string): OrgChartTree {
  const q = query.trim().toLowerCase();
  if (!q) return tree;

  const branches = tree.branches
    .map((branch) => {
      const branchMatch =
        branch.name.toLowerCase().includes(q) || branch.code.toLowerCase().includes(q);

      const departments = branch.departments
        .map((department) => {
          const departmentMatch = departmentMatchesQuery(department, q);

          const headMatch = department.head ? employeeMatchesQuery(department.head, q) : false;
          const matchedMembers = department.members.filter((employee) =>
            employeeMatchesQuery(employee, q),
          );

          if (!departmentMatch && !headMatch && matchedMembers.length === 0) return null;

          if (departmentMatch) {
            return department;
          }

          return {
            ...department,
            head: headMatch ? department.head : undefined,
            members: headMatch ? department.members : matchedMembers,
            employeeCount: (headMatch && department.head ? 1 : 0) + matchedMembers.length,
          };
        })
        .filter((department): department is OrgChartDepartment => department !== null);

      const branchHeadMatch = branch.branchHead
        ? employeeMatchesQuery(branch.branchHead, q)
        : false;

      if (!branchMatch && !branchHeadMatch && departments.length === 0) return null;

      return {
        ...branch,
        departments,
        employeeCount:
          departments.reduce((sum, dept) => sum + dept.employeeCount, 0) +
          (branch.branchHead ? 1 : 0),
      };
    })
    .filter((branch): branch is OrgChartBranch => branch !== null);

  return {
    ...tree,
    branches,
    stats: {
      branches: branches.length,
      departments: branches.reduce((sum, branch) => sum + branch.departments.length, 0),
      employees: branches.reduce(
        (sum, branch) =>
          sum +
          branch.departments.reduce((deptSum, dept) => deptSum + dept.employeeCount, 0) +
          (branch.branchHead ? 1 : 0),
        0,
      ),
    },
  };
}
