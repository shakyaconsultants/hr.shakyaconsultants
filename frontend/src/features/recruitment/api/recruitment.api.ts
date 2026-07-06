import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';
import {
  normalizeKanbanPayload,
  normalizePaginatedItems,
  unwrapEntityPayload,
} from '@/shared/utils/api-normalize.util';
import { normalizeCandidate } from '@/features/recruitment/utils/recruitment-display.util';
import { isAxiosError } from 'axios';

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
  const { data } = await apiClient.get<ApiSuccessResponse<RecruitmentDashboard>>(
    `${RECRUITMENT_PREFIX}/dashboard`,
  );
  const dashboard = data.data;
  return {
    ...dashboard,
    todaysInterviews: dashboard.todaysInterviews ?? [],
    upcomingInterviews: dashboard.upcomingInterviews ?? [],
    offersPending: dashboard.offersPending ?? [],
    joiningThisWeek: (dashboard.joiningThisWeek ?? []).map((item) => normalizeCandidate(item)),
    recentActivity: dashboard.recentActivity ?? [],
    pipelineOverview: dashboard.pipelineOverview ?? {},
  };
}

export async function fetchCandidates(
  params: ListCandidatesParams = {},
): Promise<PaginatedResult<CandidateRecord>> {
  const { data } = await apiClient.get<any>(`${RECRUITMENT_PREFIX}/candidates`, { params });
  const normalized = normalizePaginatedItems<CandidateRecord>(data.data);
  return {
    ...normalized,
    items: normalized.items.map((item) => normalizeCandidate(item)),
  };
}

export interface CandidateDetailResponse {
  candidate: CandidateRecord;
  timeline?: TimelineEvent[];
  resumes?: unknown[];
}

export async function fetchCandidate(id: string): Promise<CandidateRecord> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<CandidateDetailResponse | CandidateRecord>
  >(`${RECRUITMENT_PREFIX}/candidates/${id}`);
  const entity = unwrapEntityPayload<CandidateRecord>(
    data.data as CandidateRecord | Record<string, unknown>,
    ['candidate'],
  );
  return normalizeCandidate(entity);
}

export async function createCandidate(payload: Record<string, unknown>): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates`,
    payload,
  );
  return normalizeCandidate(data.data);
}

export async function updateCandidate(
  id: string,
  payload: Record<string, unknown>,
): Promise<CandidateRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates/${id}`,
    payload,
  );
  return normalizeCandidate(data.data);
}

export async function archiveCandidate(id: string): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates/${id}/archive`,
  );
  return normalizeCandidate(data.data);
}

export async function restoreCandidate(id: string): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates/${id}/restore`,
  );
  return normalizeCandidate(data.data);
}

export async function transitionPipeline(
  candidateId: string,
  toStage: string,
  reason?: string,
): Promise<CandidateRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<CandidateRecord>>(
    `${RECRUITMENT_PREFIX}/candidates/${candidateId}/pipeline`,
    { toStage, reason },
  );
  return normalizeCandidate(data.data);
}

export async function fetchKanban(): Promise<KanbanData> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<KanbanData & { board?: Record<string, CandidateRecord[]> }>
  >(`${RECRUITMENT_PREFIX}/pipeline/kanban`);
  const payload = normalizeKanbanPayload(data.data);
  const columns: Record<string, CandidateRecord[]> = {};
  for (const [stage, items] of Object.entries(payload.columns)) {
    columns[stage] = (items ?? []).map((item) => normalizeCandidate(item));
  }
  return { stages: payload.stages, columns };
}

export async function fetchPipelineStages(): Promise<PipelineStage[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PipelineStage[]>>(
    `${RECRUITMENT_PREFIX}/pipeline/stages`,
  );
  return data.data;
}

export async function fetchCandidateTimeline(candidateId: string): Promise<TimelineEvent[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<TimelineEvent[]>>(
    `${RECRUITMENT_PREFIX}/candidates/${candidateId}/timeline`,
  );
  return data.data;
}

export async function fetchInterviews(
  params: { candidateLeadId?: string; from?: string; to?: string } = {},
): Promise<InterviewRecord[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<InterviewRecord[]>>(
    `${RECRUITMENT_PREFIX}/interviews`,
    { params },
  );
  return data.data;
}

export async function createInterview(payload: Record<string, unknown>): Promise<InterviewRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<InterviewRecord>>(
    `${RECRUITMENT_PREFIX}/interviews`,
    payload,
  );
  return data.data;
}

export async function createOffer(payload: Record<string, unknown>): Promise<OfferRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<OfferRecord>>(
    `${RECRUITMENT_PREFIX}/offers`,
    payload,
  );
  return data.data;
}

export async function sendOffer(offerId: string): Promise<OfferRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<OfferRecord>>(
    `${RECRUITMENT_PREFIX}/offers/${offerId}/send`,
  );
  return data.data;
}

export async function sendOfferWithOnboarding(
  offerId: string,
): Promise<{ offer: OfferRecord; portalUrl: string; expiresAt: string }> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ offer: OfferRecord; portalUrl: string; expiresAt: string }>
  >(`${RECRUITMENT_PREFIX}/offers/${offerId}/send-with-onboarding`);
  return data.data;
}

export async function acceptOffer(offerId: string): Promise<OfferRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<OfferRecord>>(
    `${RECRUITMENT_PREFIX}/offers/${offerId}/accept`,
  );
  return data.data;
}

export async function rejectOffer(offerId: string): Promise<OfferRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<OfferRecord>>(
    `${RECRUITMENT_PREFIX}/offers/${offerId}/reject`,
  );
  return data.data;
}

export async function startOnboarding(
  candidateId: string,
  payload: { offerLetterId: string; startDate?: string },
): Promise<OnboardingRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<OnboardingRecord>>(
    `${RECRUITMENT_PREFIX}/onboarding/${candidateId}/start`,
    payload,
  );
  return data.data;
}

export async function issueOnboardingPortal(
  candidateId: string,
): Promise<{ portalUrl: string; expiresAt: string }> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ portalUrl: string; expiresAt: string }>
  >(`${RECRUITMENT_PREFIX}/onboarding/${candidateId}/portal-link`);
  return data.data;
}

export async function fetchOffers(
  params: { candidateLeadId?: string } = {},
): Promise<OfferRecord[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<OfferRecord[]>>(
    `${RECRUITMENT_PREFIX}/offers`,
    { params },
  );
  return data.data;
}

export async function fetchOnboarding(candidateId: string): Promise<OnboardingRecord | null> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<OnboardingRecord | null>>(
      `${RECRUITMENT_PREFIX}/onboarding/${candidateId}`,
    );
    return data.data ?? null;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveOnboardingDraft(
  candidateId: string,
  payload: Record<string, unknown>,
): Promise<OnboardingRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<OnboardingRecord>>(
    `${RECRUITMENT_PREFIX}/onboarding/${candidateId}/draft`,
    payload,
  );
  return data.data;
}

export async function convertCandidate(
  payload: Record<string, unknown>,
): Promise<{ employee: Record<string, unknown>; userId: string }> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ employee: Record<string, unknown>; userId: string }>
  >(`${RECRUITMENT_PREFIX}/conversion`, payload);
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
  return normalizeCandidate(data.data);
}
