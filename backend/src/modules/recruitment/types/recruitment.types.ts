import type {
  CandidateLeadDocument,
  InterviewDocument,
  OfferLetterDocument,
} from '@domain/recruitment/recruitment.schemas.js';
import type { ActivityLogDocument } from '@domain/audit/audit.schemas.js';

export interface RecruitmentActorContext {
  companyId: string;
  userId: string;
  employeeId?: string;
  ip?: string;
  userAgent?: string;
}

export interface CandidateListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  pipelineStage?: string;
  designationId?: string;
  departmentId?: string;
  recruiterId?: string;
  includeArchived?: boolean;
}

export interface RecruitmentDashboardData {
  pipelineOverview: Record<string, number>;
  todaysInterviews: InterviewDocument[];
  upcomingInterviews: InterviewDocument[];
  offersPending: OfferLetterDocument[];
  joiningThisWeek: CandidateLeadDocument[];
  conversionRate: number;
  recentActivity: Pick<ActivityLogDocument, 'id' | 'activityType' | 'description' | 'createdAt'>[];
}
