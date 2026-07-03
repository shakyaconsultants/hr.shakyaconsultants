import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import type {
  OrgChartBranch,
  OrgChartBuildInput,
  OrgChartDepartment,
  OrgChartEmployee,
  OrgChartTree,
} from '@/features/admin/components/org-chart/org-chart.types';

const UNASSIGNED_BRANCH_ID = '__unassigned__';

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

function buildDepartmentEmployees(
  departmentId: string,
  employees: EmployeeRecord[],
  designationMap: Map<string, Record<string, unknown>>,
): OrgChartEmployee[] {
  return employees
    .filter((employee) => employee.departmentId === departmentId)
    .map((employee) => mapEmployee(employee, designationMap))
    .sort((a, b) => b.hierarchyLevel - a.hierarchyLevel || a.lastName.localeCompare(b.lastName));
}

function buildDepartment(
  department: Record<string, unknown>,
  employees: EmployeeRecord[],
  designationMap: Map<string, Record<string, unknown>>,
): OrgChartDepartment {
  const id = String(department.id);
  const deptEmployees = buildDepartmentEmployees(id, employees, designationMap);

  return {
    id,
    name: String(department.name ?? 'Department'),
    code: String(department.code ?? ''),
    employeeCount: deptEmployees.length,
    employees: deptEmployees,
  };
}

export function buildOrgChartTree(input: OrgChartBuildInput): OrgChartTree {
  const { company, branches, departments, designations, employees } = input;
  const designationMap = new Map(designations.map((item) => [String(item.id), item]));

  const branchRecords = branches.length > 0 ? branches : [];
  const departmentsByBranch = new Map<string, Record<string, unknown>[]>();

  for (const department of departments) {
    const branchId = department.branchId ? String(department.branchId) : UNASSIGNED_BRANCH_ID;
    const list = departmentsByBranch.get(branchId) ?? [];
    list.push(department);
    departmentsByBranch.set(branchId, list);
  }

  const chartBranches: OrgChartBranch[] = branchRecords.map((branch) => {
    const branchDepartments = departmentsByBranch.get(String(branch.id)) ?? [];
    const deptNodes = branchDepartments.map((department) =>
      buildDepartment(department, employees, designationMap),
    );

    return {
      id: String(branch.id),
      name: String(branch.name ?? 'Branch'),
      code: String(branch.code ?? ''),
      departments: deptNodes.sort((a, b) => a.name.localeCompare(b.name)),
      employeeCount: deptNodes.reduce((sum, dept) => sum + dept.employeeCount, 0),
    };
  });

  const unassignedDepartments = departmentsByBranch.get(UNASSIGNED_BRANCH_ID) ?? [];
  if (unassignedDepartments.length > 0) {
    const deptNodes = unassignedDepartments.map((department) =>
      buildDepartment(department, employees, designationMap),
    );
    chartBranches.push({
      id: UNASSIGNED_BRANCH_ID,
      name: 'Head Office / Unassigned',
      code: 'HQ',
      departments: deptNodes.sort((a, b) => a.name.localeCompare(b.name)),
      employeeCount: deptNodes.reduce((sum, dept) => sum + dept.employeeCount, 0),
    });
  }

  if (chartBranches.length === 0 && departments.length > 0) {
    const deptNodes = departments.map((department) =>
      buildDepartment(department, employees, designationMap),
    );
    chartBranches.push({
      id: 'company-wide',
      name: 'Company Wide',
      code: 'ALL',
      departments: deptNodes.sort((a, b) => a.name.localeCompare(b.name)),
      employeeCount: deptNodes.reduce((sum, dept) => sum + dept.employeeCount, 0),
    });
  }

  const totalDepartments = chartBranches.reduce((sum, branch) => sum + branch.departments.length, 0);

  return {
    companyName: String(company?.name ?? 'Company'),
    companyCode: String(company?.code ?? ''),
    branches: chartBranches,
    stats: {
      branches: chartBranches.length,
      departments: totalDepartments,
      employees: employees.length,
    },
  };
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
          const departmentMatch =
            department.name.toLowerCase().includes(q) || department.code.toLowerCase().includes(q);

          const matchedEmployees = department.employees.filter((employee) => {
            const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
            return (
              fullName.includes(q) ||
              employee.email.toLowerCase().includes(q) ||
              employee.designationName.toLowerCase().includes(q)
            );
          });

          if (!departmentMatch && matchedEmployees.length === 0) return null;

          return {
            ...department,
            employees: departmentMatch ? department.employees : matchedEmployees,
            employeeCount: departmentMatch ? department.employeeCount : matchedEmployees.length,
          };
        })
        .filter((department): department is OrgChartDepartment => department !== null);

      if (!branchMatch && departments.length === 0) return null;

      return {
        ...branch,
        departments,
        employeeCount: departments.reduce((sum, dept) => sum + dept.employeeCount, 0),
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
        (sum, branch) => sum + branch.departments.reduce((deptSum, dept) => deptSum + dept.employeeCount, 0),
        0,
      ),
    },
  };
}
