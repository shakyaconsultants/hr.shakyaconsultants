export interface EmployeeActorContext {
  companyId: string;
  userId: string;
  employeeId?: string;
  ip?: string;
  userAgent?: string;
}

export interface EmployeeListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  employmentStatus?: string;
  departmentId?: string;
  branchId?: string;
  designationId?: string;
  reportingManagerId?: string;
  includeDeleted?: boolean;
  includeArchived?: boolean;
}

export interface EmployeeDashboardData {
  employee: Record<string, unknown>;
  emergencyContacts: Record<string, unknown>[];
  bankDetails: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  education: Record<string, unknown>[];
  experience: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  timeline: Record<string, unknown>[];
  managers: Record<string, unknown>[];
}
