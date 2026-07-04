import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';
import { normalizePaginatedItems } from '@/shared/utils/api-normalize.util';
import { API_MAX_PAGE_SIZE } from '@/shared/constants/pagination.constants';

const EMPLOYEE_PREFIX = '/api/v1/employees';

export interface EmployeeRecord {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  departmentId: string;
  designationId: string;
  branchId?: string;
  employmentType: string;
  employmentStatus: string;
  status: string;
  joinedAt: string;
}

export interface EmployeeEmailDeliveryView {
  deliveryStatus: 'never_sent' | 'sent' | 'failed';
  lastSentAt: string | null;
  sendCount: number;
  lastError: string | null;
}

export interface EmployeeLifecycleProfile {
  account: {
    hasUserAccount: boolean;
    userStatus: string | null;
    isActivated: boolean;
    email: EmployeeEmailDeliveryView;
  };
  onboarding: {
    status: string;
    progressPercent: number;
    isComplete: boolean;
    email: EmployeeEmailDeliveryView;
  };
  passwordReset: {
    email: EmployeeEmailDeliveryView;
  };
}

export interface EmployeeDashboard {
  employee: EmployeeRecord;
  lifecycle: EmployeeLifecycleProfile;
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

export interface ListEmployeesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  departmentId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchEmployees(params: ListEmployeesParams = {}): Promise<PaginatedResult<EmployeeRecord>> {
  const pageSize = params.pageSize ? Math.min(params.pageSize, API_MAX_PAGE_SIZE) : undefined;
  const { data } = await apiClient.get<any>(EMPLOYEE_PREFIX, {
    params: { ...params, pageSize },
  });
  return normalizePaginatedItems<EmployeeRecord>(data.data);
}

export async function fetchAllEmployees(
  params: Omit<ListEmployeesParams, 'page' | 'pageSize'> = {},
): Promise<EmployeeRecord[]> {
  const items: EmployeeRecord[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await fetchEmployees({ ...params, page, pageSize: API_MAX_PAGE_SIZE });
    items.push(...result.items);
    totalPages = result.pagination?.totalPages ?? 1;
    page += 1;
  }

  return items;
}

export async function fetchEmployee(id: string): Promise<EmployeeRecord> {
  const { data } = await apiClient.get<ApiSuccessResponse<EmployeeRecord>>(`${EMPLOYEE_PREFIX}/${id}`);
  return data.data;
}

export async function fetchEmployeeDashboard(id: string): Promise<EmployeeDashboard> {
  const { data } = await apiClient.get<ApiSuccessResponse<EmployeeDashboard>>(`${EMPLOYEE_PREFIX}/${id}/dashboard`);
  return data.data;
}

export async function createEmployee(payload: Record<string, unknown>): Promise<EmployeeRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<EmployeeRecord>>(EMPLOYEE_PREFIX, payload);
  return data.data;
}

export async function updateEmployee(id: string, payload: Record<string, unknown>): Promise<EmployeeRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<EmployeeRecord>>(`${EMPLOYEE_PREFIX}/${id}`, payload);
  return data.data;
}

export async function searchEmployees(q: string, limit = 20): Promise<EmployeeRecord[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<EmployeeRecord[]>>(`${EMPLOYEE_PREFIX}/search`, {
    params: { q, limit },
  });
  return data.data;
}

export async function exportEmployees(params: ListEmployeesParams = {}): Promise<Blob> {
  const response = await apiClient.get(`${EMPLOYEE_PREFIX}/export`, {
    params,
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function uploadDocument(employeeId: string, file: File, documentType: string): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  const { data } = await apiClient.post(`${EMPLOYEE_PREFIX}/${employeeId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`${EMPLOYEE_PREFIX}/${id}`);
}

export async function archiveEmployee(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`${EMPLOYEE_PREFIX}/${id}/archive`);
  return data.data;
}

export async function restoreEmployee(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`${EMPLOYEE_PREFIX}/${id}/restore`);
  return data.data;
}

export async function deactivateEmployee(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`${EMPLOYEE_PREFIX}/${id}/deactivate`);
  return data.data;
}

export async function reactivateEmployee(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`${EMPLOYEE_PREFIX}/${id}/reactivate`);
  return data.data;
}

export async function sendEmployeeActivationEmail(employeeId: string): Promise<{
  message: string;
  expiresAt: string;
  lifecycle: EmployeeLifecycleProfile;
}> {
  const { data } = await apiClient.post<ApiSuccessResponse<{
    message: string;
    expiresAt: string;
    lifecycle: EmployeeLifecycleProfile;
  }>>(`${EMPLOYEE_PREFIX}/${employeeId}/activate-account`);
  return data.data;
}

export async function sendEmployeeOnboardingEmail(employeeId: string): Promise<{
  message: string;
  expiresAt: string;
  lifecycle: EmployeeLifecycleProfile;
}> {
  const { data } = await apiClient.post<ApiSuccessResponse<{
    message: string;
    expiresAt: string;
    lifecycle: EmployeeLifecycleProfile;
  }>>(`${EMPLOYEE_PREFIX}/${employeeId}/send-onboarding-email`);
  return data.data;
}

export async function sendEmployeePasswordResetEmail(employeeId: string): Promise<{
  message: string;
  lifecycle: EmployeeLifecycleProfile;
}> {
  const { data } = await apiClient.post<ApiSuccessResponse<{
    message: string;
    lifecycle: EmployeeLifecycleProfile;
  }>>(`${EMPLOYEE_PREFIX}/${employeeId}/send-password-reset`);
  return data.data;
}

export interface ReportingPerson {
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

export interface ReportingRelationship {
  id: string;
  employeeId: string;
  managerId: string;
  relationshipType: string;
  isPrimary: boolean;
  effectiveFrom: string;
  manager?: ReportingPerson;
}

export interface DirectReport extends ReportingPerson {
  relationshipId: string;
  relationshipType: string;
}

export interface ReportingChartNode extends ReportingPerson {
  directReports: ReportingChartNode[];
}

export interface ReportingChartTree {
  companyName: string;
  roots: ReportingChartNode[];
  stats: {
    employees: number;
    withManager: number;
    roots: number;
  };
}

export async function fetchReportingTree(): Promise<ReportingChartTree> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReportingChartTree>>(`${EMPLOYEE_PREFIX}/reporting-tree`);
  return data.data;
}

export async function fetchEmployeeManagers(employeeId: string): Promise<ReportingRelationship[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReportingRelationship[]>>(
    `${EMPLOYEE_PREFIX}/${employeeId}/managers`,
  );
  return data.data;
}

export async function fetchEmployeeDirectReports(employeeId: string): Promise<DirectReport[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<DirectReport[]>>(
    `${EMPLOYEE_PREFIX}/${employeeId}/direct-reports`,
  );
  return data.data;
}

export async function assignEmployeeManager(
  employeeId: string,
  payload: { managerId: string; relationshipType?: string; isPrimary?: boolean },
): Promise<unknown> {
  const { data } = await apiClient.post(`${EMPLOYEE_PREFIX}/${employeeId}/managers`, {
    relationshipType: 'direct',
    isPrimary: true,
    ...payload,
  });
  return data.data;
}

export async function endEmployeeManagerRelationship(employeeId: string, relationshipId: string): Promise<void> {
  await apiClient.delete(`${EMPLOYEE_PREFIX}/${employeeId}/managers/${relationshipId}`);
}
