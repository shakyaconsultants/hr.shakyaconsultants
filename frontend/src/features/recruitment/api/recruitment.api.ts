import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';
import { normalizeKanbanPayload, normalizePaginatedItems } from '@/shared/utils/api-normalize.util';

const RECRUITMENT_PREFIX = '/api/v1/recruitment';

export interface CandidateRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  pipelineStage: string;
  departmentId?: string;
  designationId?: string;
  recruiterId?: string;
  resumeUrl?: string;
  isArchived: boolean;
  employeeId?: string;
  convertedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isTerminal: boolean;
  isDefault: boolean;
}

export interface KanbanData {
  stages: PipelineStage[];
  columns: Record<string, CandidateRecord[]>;
}

export interface InterviewRecord {
  id: string;
  candidateLeadId: string;
  round: number;
  interviewType: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  meetingLink?: string;
  interviewerIds: string[];
  notes?: string;
  score?: number;
  decision?: string;
}

export interface OfferRecord {
  id: string;
  candidateLeadId: string;
  status: string;
  version: number;
  joiningDate?: string;
  salaryBreakdown?: Record<string, unknown>;
  documentUrl?: string;
  expiresAt?: string;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface OnboardingRecord {
  id: string;
  candidateLeadId: string;
  progressPercent: number;
  currentSection?: string;
  completedSections: string[];
  formData: Record<string, unknown>;
}

export interface RecruitmentDashboard {
  pipelineOverview: Record<string, number>;
  todaysInterviews: InterviewRecord[];
  upcomingInterviews: InterviewRecord[];
  offersPending: OfferRecord[];
  joiningThisWeek: CandidateRecord[];
  conversionRate: number;
  recentActivity: { id: string; activityType: string; description: string; createdAt: string }[];
}

export interface ListCandidatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  pipelineStage?: string;
  designationId?: string;
  departmentId?: string;
  recruiterId?: string;
  includeArchived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchRecruitmentDashboard(): Promise<RecruitmentDashboard> {
  const { data } = await apiClient.get<ApiSuccessResponse<RecruitmentDashboard>>(`${RECRUITMENT_PREFIX}/dashboard`);
  const dashboard = data.data;
  return {
    ...dashboard,
    todaysInterviews: dashboard.todaysInterviews ?? [],
    upcomingInterviews: dashboard.upcomingInterviews ?? [],
    offersPending: dashboard.offersPending ?? [],
    joiningThisWeek: dashboard.joiningThisWeek ?? [],
    recentActivity: dashboard.recentActivity ?? [],
    pipelineOverview: dashboard.pipelineOverview ?? {},
  };
}

export async function fetchCandidates(params: ListCandidatesParams = {}): Promise<PaginatedResult<CandidateRecord>> {
  const { data } = await apiClient.get<any>(
    `${RECRUITMENT_PREFIX}/candidates`,
    { params },
  );
  return normalizePaginatedItems<CandidateRecord>(data.data);
}

export async function fetchCandidate(id: string): Promise<CandidateRecord> {
  const { data } = await apiClient.get<ApiSuccessResponse<CandidateRecord>>(`${RECRUITMENT_PREFIX}/candidates/${id}`);
  return data.data;
}

export async function createCandidate(payload: Record<string, unknown>): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(`${RECRUITMENT_PREFIX}/candidates`, payload);
  return data.data;
}

export async function updateCandidate(id: string, payload: Record<string, unknown>): Promise<CandidateRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<CandidateRecord>>(`${RECRUITMENT_PREFIX}/candidates/${id}`, payload);
  return data.data;
}

export async function archiveCandidate(id: string): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(`${RECRUITMENT_PREFIX}/candidates/${id}/archive`);
  return data.data;
}

export async function restoreCandidate(id: string): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(`${RECRUITMENT_PREFIX}/candidates/${id}/restore`);
  return data.data;
}

export async function transitionPipeline(candidateId: string, stage: string, reason?: string): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates/${candidateId}/pipeline`,
    { stage, reason },
  );
  return data.data;
}

export async function fetchKanban(): Promise<KanbanData> {
  const { data } = await apiClient.get<ApiSuccessResponse<KanbanData & { board?: Record<string, CandidateRecord[]> }>>(
    `${RECRUITMENT_PREFIX}/pipeline/kanban`,
  );
  return normalizeKanbanPayload(data.data);
}

export async function fetchPipelineStages(): Promise<PipelineStage[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PipelineStage[]>>(`${RECRUITMENT_PREFIX}/pipeline/stages`);
  return data.data;
}

export async function fetchCandidateTimeline(candidateId: string): Promise<TimelineEvent[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<TimelineEvent[]>>(
    `${RECRUITMENT_PREFIX}/candidates/${candidateId}/timeline`,
  );
  return data.data;
}

export async function fetchInterviews(params: { candidateLeadId?: string; from?: string; to?: string } = {}): Promise<InterviewRecord[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<InterviewRecord[]>>(`${RECRUITMENT_PREFIX}/interviews`, { params });
  return data.data;
}

export async function createInterview(payload: Record<string, unknown>): Promise<InterviewRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<InterviewRecord>>(`${RECRUITMENT_PREFIX}/interviews`, payload);
  return data.data;
}

export async function fetchOffers(params: { candidateLeadId?: string } = {}): Promise<OfferRecord[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<OfferRecord[]>>(`${RECRUITMENT_PREFIX}/offers`, { params });
  return data.data;
}

export async function fetchOnboarding(candidateId: string): Promise<OnboardingRecord> {
  const { data } = await apiClient.get<ApiSuccessResponse<OnboardingRecord>>(`${RECRUITMENT_PREFIX}/onboarding/${candidateId}`);
  return data.data;
}

export async function saveOnboardingDraft(candidateId: string, payload: Record<string, unknown>): Promise<OnboardingRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<OnboardingRecord>>(
    `${RECRUITMENT_PREFIX}/onboarding/${candidateId}/draft`,
    payload,
  );
  return data.data;
}

export async function convertCandidate(payload: Record<string, unknown>): Promise<{ employee: Record<string, unknown>; userId: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ employee: Record<string, unknown>; userId: string }>>(
    `${RECRUITMENT_PREFIX}/conversion`,
    payload,
  );
  return data.data;
}

export async function exportCandidates(params: ListCandidatesParams = {}): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`${RECRUITMENT_PREFIX}/candidates/export`, {
    params,
    responseType: 'blob',
  });
  return data;
}

export async function uploadResume(candidateId: string, file: File): Promise<CandidateRecord> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates/${candidateId}/resume`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}
