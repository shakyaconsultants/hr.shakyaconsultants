import { z } from 'zod';
import { PIPELINE_STAGE, INTERVIEW_TYPE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { INTERVIEW_RECOMMENDATION } from '@domain/recruitment/recruitment.schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });
export const candidateIdParamSchema = z.object({ candidateId: z.uuid() });

export const candidateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  pipelineStage: z.enum(Object.values(PIPELINE_STAGE) as [string, ...string[]]).optional(),
  jobRoleId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  recruiterId: z.uuid().optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export const createCandidateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().optional(),
  source: z.string().optional(),
  jobRoleId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  designationId: z.uuid().optional(),
  recruiterId: z.uuid().optional(),
  expectedSalary: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCandidateSchema = createCandidateSchema.partial();

export const mergeCandidateSchema = z.object({
  primaryId: z.uuid(),
  secondaryId: z.uuid(),
});

export const pipelineTransitionSchema = z.object({
  toStage: z.enum(Object.values(PIPELINE_STAGE) as [string, ...string[]]),
  reason: z.string().optional(),
});

export const createInterviewSchema = z.object({
  candidateLeadId: z.uuid(),
  jobRoleId: z.uuid(),
  round: z.coerce.number().int().min(1).optional(),
  interviewType: z.enum(Object.values(INTERVIEW_TYPE) as [string, ...string[]]).optional(),
  interviewerIds: z.array(z.uuid()).optional(),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(15).optional(),
  mode: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.union([z.url(), z.literal('')]).optional(),
  notes: z.string().optional(),
});

export const rescheduleInterviewSchema = z.object({
  scheduledAt: z.coerce.date(),
  meetingLink: z.string().optional(),
});

export const cancelInterviewSchema = z.object({
  reason: z.string().optional(),
});

export const interviewFeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  recommendation: z.enum(Object.values(INTERVIEW_RECOMMENDATION) as [string, ...string[]]),
  comments: z.string().optional(),
});

export const createOfferSchema = z.object({
  candidateLeadId: z.uuid(),
  jobRoleId: z.uuid(),
  departmentId: z.uuid(),
  branchId: z.uuid().optional(),
  designationId: z.uuid().optional(),
  reportingManagerId: z.uuid().optional(),
  salary: z.coerce.number().min(0),
  currency: z.string().optional(),
  salaryBreakdown: z.record(z.string(), z.unknown()).optional(),
  joiningDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
});

export const onboardingDraftSchema = z.object({
  section: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export const conversionSchema = z.object({
  candidateLeadId: z.uuid(),
  branchId: z.uuid().optional(),
  departmentId: z.uuid(),
  designationId: z.uuid(),
  jobRoleId: z.uuid().optional(),
  reportingManagerId: z.uuid().optional(),
  roleSlug: z.string().optional(),
  temporaryPassword: z.string().min(8).optional(),
});

export const importCsvSchema = z.object({
  content: z.string().min(1),
});
