import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';
import { normalizePaginatedItems } from '@/shared/utils/api-normalize.util';

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

export interface EmployeeDashboard {
  employee: EmployeeRecord;
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
  const { data } = await apiClient.get<any>(
    EMPLOYEE_PREFIX,
    { params },
  );
  return normalizePaginatedItems<EmployeeRecord>(data.data);
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
