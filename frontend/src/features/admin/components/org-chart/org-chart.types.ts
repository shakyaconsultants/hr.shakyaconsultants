import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import type { MasterDataRecord } from '@/features/organization/api/organization.api';

export interface OrgChartEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  designationId: string;
  designationName: string;
  hierarchyLevel: number;
}

export interface OrgChartDepartment {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  employees: OrgChartEmployee[];
}

export interface OrgChartBranch {
  id: string;
  name: string;
  code: string;
  departments: OrgChartDepartment[];
  employeeCount: number;
}

export interface OrgChartTree {
  companyName: string;
  companyCode: string;
  branches: OrgChartBranch[];
  stats: {
    branches: number;
    departments: number;
    employees: number;
  };
}

export interface OrgChartBuildInput {
  company: Record<string, unknown> | undefined;
  branches: MasterDataRecord[];
  departments: MasterDataRecord[];
  designations: MasterDataRecord[];
  employees: EmployeeRecord[];
}
