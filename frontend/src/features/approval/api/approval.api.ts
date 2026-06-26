import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';

const APPROVAL_PREFIX = '/api/v1/approvals';

export interface ApprovalRequest {
  id: string;
  requestType: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  status: string;
  currentStageSlug?: string;
  currentStageIndex: number;
  requesterEmployeeId: string;
  pendingApproverEmployeeIds: string[];
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ApprovalTimelineEntry {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  occurredAt: string;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  slug: string;
  requestType: string;
  stages: Array<{ name: string; slug: string; order: number; approverType: string }>;
  isDefault: boolean;
}

export interface ApprovalListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  requestType?: string;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

export async function fetchApprovalInbox(params: ApprovalListParams = {}): Promise<PaginatedResult<ApprovalRequest>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<ApprovalRequest>>>(`${APPROVAL_PREFIX}/inbox`, { params });
  return unwrap(response);
}

export async function fetchApprovalRequests(params: ApprovalListParams = {}): Promise<PaginatedResult<ApprovalRequest>> {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResult<ApprovalRequest>>>(`${APPROVAL_PREFIX}/requests`, { params });
  return unwrap(response);
}

export async function fetchApprovalHistory(id: string): Promise<{ request: ApprovalRequest; timeline: ApprovalTimelineEntry[]; actions: unknown[] }> {
  const response = await apiClient.get<ApiSuccessResponse<{ request: ApprovalRequest; timeline: ApprovalTimelineEntry[]; actions: unknown[] }>>(
    `${APPROVAL_PREFIX}/requests/${id}/history`,
  );
  return unwrap(response);
}

export async function approveRequest(id: string, comments?: string): Promise<ApprovalRequest> {
  const response = await apiClient.post<ApiSuccessResponse<ApprovalRequest>>(`${APPROVAL_PREFIX}/requests/${id}/approve`, { comments });
  return unwrap(response);
}

export async function rejectRequest(id: string, comments?: string): Promise<ApprovalRequest> {
  const response = await apiClient.post<ApiSuccessResponse<ApprovalRequest>>(`${APPROVAL_PREFIX}/requests/${id}/reject`, { comments });
  return unwrap(response);
}

export async function bulkApproveRequests(requestIds: string[], comments?: string): Promise<{ approved: number; failed: string[] }> {
  const response = await apiClient.post<ApiSuccessResponse<{ approved: number; failed: string[] }>>(`${APPROVAL_PREFIX}/requests/bulk-approve`, {
    requestIds,
    comments,
  });
  return unwrap(response);
}

export async function fetchWorkflows(requestType?: string): Promise<ApprovalWorkflow[]> {
  const response = await apiClient.get<ApiSuccessResponse<ApprovalWorkflow[]>>(`${APPROVAL_PREFIX}/workflows`, {
    params: requestType ? { requestType } : undefined,
  });
  return unwrap(response);
}

export async function createWorkflow(payload: {
  name: string;
  slug: string;
  requestType: string;
  description?: string;
  stages: ApprovalWorkflow['stages'];
  isDefault?: boolean;
}): Promise<ApprovalWorkflow> {
  const response = await apiClient.post<ApiSuccessResponse<ApprovalWorkflow>>(`${APPROVAL_PREFIX}/workflows`, payload);
  return unwrap(response);
}

export async function updateWorkflow(
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    requestType: string;
    description: string;
    stages: ApprovalWorkflow['stages'];
    isDefault: boolean;
  }>,
): Promise<ApprovalWorkflow> {
  const response = await apiClient.patch<ApiSuccessResponse<ApprovalWorkflow>>(`${APPROVAL_PREFIX}/workflows/${id}`, payload);
  return unwrap(response);
}
