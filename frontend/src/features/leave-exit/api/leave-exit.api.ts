import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';

const LEAVE_EXIT_PREFIX = '/api/v1/leave-exit';

export interface LeavePolicy {
  id: string;
  name: string;
  code: string;
  category: string;
  annualQuota: number;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  carryForwardEnabled: boolean;
  status: string;
}

export interface LeaveBalance {
  id: string;
  leavePolicyId: string;
  year: number;
  openingBalance: number;
  earned: number;
  used: number;
  pending: number;
  available: number;
  carryForward: number;
  policy?: LeavePolicy;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leavePolicyId: string;
  startDate: string;
  endDate: string;
  durationType: string;
  totalDays: number;
  reason: string;
  status: string;
  isEmergency?: boolean;
  approvalRequestId?: string;
}

export interface Resignation {
  id: string;
  employeeId: string;
  reason: string;
  noticePeriodDays: number;
  expectedLastWorkingDay: string;
  status: string;
  approvalRequestId?: string;
}

export interface ExitChecklistItem {
  id: string;
  name: string;
  category: string;
  status: string;
  sortOrder: number;
  completedAt?: string;
}

export interface ExitProcess {
  id: string;
  employeeId: string;
  resignationId: string;
  status: string;
  items: ExitChecklistItem[];
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface ApplyLeavePayload {
  employeeId: string;
  leavePolicyId: string;
  startDate: string;
  endDate: string;
  durationType: string;
  halfDaySession?: string;
  reason: string;
  isEmergency?: boolean;
  submit?: boolean;
}

export interface SubmitResignationPayload {
  employeeId: string;
  reason: string;
  noticePeriodDays: number;
  expectedLastWorkingDay: string;
  comments?: string;
}

export interface ListLeaveParams {
  page?: number;
  pageSize?: number;
  status?: string;
  employeeId?: string;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

export async function fetchLeavePolicies(): Promise<LeavePolicy[]> {
  const response = await apiClient.get<ApiSuccessResponse<LeavePolicy[]>>(`${LEAVE_EXIT_PREFIX}/policies`);
  return unwrap(response);
}

export async function fetchLeaveBalances(employeeId?: string, year?: number): Promise<LeaveBalance[]> {
  const response = await apiClient.get<ApiSuccessResponse<LeaveBalance[]>>(`${LEAVE_EXIT_PREFIX}/balances`, {
    params: { employeeId, year },
  });
  return unwrap(response);
}

export async function fetchLeaveRequests(params: ListLeaveParams = {}): Promise<PaginatedResult<LeaveRequest>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<LeaveRequest>>>(`${LEAVE_EXIT_PREFIX}/leave-requests`, { params });
  return unwrap(response);
}

export async function applyLeave(payload: ApplyLeavePayload): Promise<LeaveRequest> {
  const response = await apiClient.post<ApiSuccessResponse<LeaveRequest>>(`${LEAVE_EXIT_PREFIX}/leave-requests`, payload);
  return unwrap(response);
}

export async function withdrawLeave(id: string): Promise<LeaveRequest> {
  const response = await apiClient.post<ApiSuccessResponse<LeaveRequest>>(`${LEAVE_EXIT_PREFIX}/leave-requests/${id}/withdraw`);
  return unwrap(response);
}

export async function fetchLeaveCalendar(startDate: string, endDate: string, employeeId?: string): Promise<LeaveRequest[]> {
  const response = await apiClient.get<ApiSuccessResponse<LeaveRequest[]>>(`${LEAVE_EXIT_PREFIX}/leave-requests/calendar`, {
    params: { startDate, endDate, employeeId },
  });
  return unwrap(response);
}

export async function fetchCompanyCalendar(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<CalendarEvent[]>>(`${LEAVE_EXIT_PREFIX}/calendar`, {
    params: { startDate, endDate },
  });
  return unwrap(response);
}

export async function fetchResignations(employeeId?: string): Promise<Resignation[]> {
  const response = await apiClient.get<ApiSuccessResponse<Resignation[]>>(`${LEAVE_EXIT_PREFIX}/resignations`, {
    params: employeeId ? { employeeId } : undefined,
  });
  return unwrap(response);
}

export async function submitResignation(payload: SubmitResignationPayload): Promise<Resignation> {
  const response = await apiClient.post<ApiSuccessResponse<Resignation>>(`${LEAVE_EXIT_PREFIX}/resignations`, payload);
  return unwrap(response);
}

export async function withdrawResignation(id: string): Promise<Resignation> {
  const response = await apiClient.post<ApiSuccessResponse<Resignation>>(`${LEAVE_EXIT_PREFIX}/resignations/${id}/withdraw`);
  return unwrap(response);
}

export async function fetchExitProcess(id: string): Promise<ExitProcess> {
  const response = await apiClient.get<ApiSuccessResponse<ExitProcess>>(`${LEAVE_EXIT_PREFIX}/exit/processes/${id}`);
  return unwrap(response);
}

export async function completeExitItem(id: string, notes?: string): Promise<ExitChecklistItem> {
  const response = await apiClient.post<ApiSuccessResponse<ExitChecklistItem>>(`${LEAVE_EXIT_PREFIX}/exit/checklist/${id}/complete`, { notes });
  return unwrap(response);
}
