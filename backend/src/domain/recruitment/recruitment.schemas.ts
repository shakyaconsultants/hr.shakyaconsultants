import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { INTERVIEW_STATUS } from '@shared/constants/status.constants.js';

export const CANDIDATE_STATUS = {
  NEW: 'new',
  SCREENING: 'screening',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export const INTERVIEW_MODE = {
  IN_PERSON: 'in_person',
  VIDEO: 'video',
  PHONE: 'phone',
} as const;

export const OFFER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export const ONBOARDING_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const INTERVIEW_RECOMMENDATION = {
  STRONG_HIRE: 'strong_hire',
  HIRE: 'hire',
  NO_HIRE: 'no_hire',
  STRONG_NO_HIRE: 'strong_no_hire',
} as const;

export interface CandidateLeadDocument extends BaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  jobRoleId?: string;
  departmentId?: string;
  branchId?: string;
  designationId?: string;
  recruiterId?: string;
  reportingManagerId?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  currency?: string;
  notes?: string;
  pipelineStage: string;
  status: string;
  isArchived: boolean;
  mergedIntoId?: string;
  employeeId?: string;
  convertedAt?: Date;
  tags: string[];
}

export interface InterviewDocument extends BaseDocument {
  candidateLeadId: string;
  jobRoleId: string;
  round: number;
  interviewType: string;
  interviewerIds: string[];
  scheduledAt: Date;
  durationMinutes: number;
  mode: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  score?: number;
  decision?: string;
  cancelledReason?: string;
  rescheduledFromId?: string;
  status: string;
}

export interface InterviewFeedbackDocument extends BaseDocument {
  interviewId: string;
  interviewerId: string;
  rating: number;
  strengths?: string;
  weaknesses?: string;
  recommendation: string;
  comments?: string;
}

export interface OfferLetterDocument extends BaseDocument {
  candidateLeadId: string;
  jobRoleId: string;
  departmentId: string;
  branchId?: string;
  designationId?: string;
  reportingManagerId?: string;
  salary: number;
  salaryBreakdown: Record<string, unknown>;
  currency: string;
  joiningDate: Date;
  expiryDate: Date;
  documentUrl?: string;
  htmlContent?: string;
  publicId?: string;
  version: number;
  status: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

export interface OnboardingDocument extends BaseDocument {
  candidateLeadId: string;
  employeeId?: string;
  offerLetterId: string;
  startDate: Date;
  formData: Record<string, unknown>;
  completedSections: string[];
  progressPercent: number;
  currentSection?: string;
  eSignPlaceholder?: string;
  checklistItems: Array<{
    title: string;
    isCompleted: boolean;
    completedAt?: Date;
    completedBy?: string;
  }>;
  status: string;
}

export interface ResumeMetadataDocument extends BaseDocument {
  candidateLeadId: string;
  fileName: string;
  fileUrl: string;
  publicId: string;
  mimeType: string;
  fileSize: number;
  version: number;
  isLatest: boolean;
  parsedData: Record<string, unknown>;
  skills: string[];
  experienceYears?: number;
}

const candidateLeadFields: SchemaDefinition = {
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  source: { type: String, trim: true },
  jobRoleId: { type: String, index: true },
  departmentId: { type: String, index: true },
  branchId: { type: String, index: true },
  designationId: { type: String, index: true },
  recruiterId: { type: String, index: true },
  reportingManagerId: { type: String, index: true },
  resumeUrl: { type: String },
  expectedSalary: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  notes: { type: String, trim: true },
  pipelineStage: { type: String, default: 'lead', index: true },
  status: { type: String, enum: Object.values(CANDIDATE_STATUS), default: CANDIDATE_STATUS.NEW },
  isArchived: { type: Boolean, default: false },
  mergedIntoId: { type: String, index: true },
  employeeId: { type: String, index: true },
  convertedAt: { type: Date },
  tags: { type: [String], default: [] },
};

const interviewFields: SchemaDefinition = {
  candidateLeadId: { type: String, required: true, index: true },
  jobRoleId: { type: String, required: true, index: true },
  round: { type: Number, default: 1, min: 1 },
  interviewType: { type: String, default: 'online', index: true },
  interviewerIds: { type: [String], default: [] },
  scheduledAt: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, required: true, min: 15 },
  mode: { type: String, enum: Object.values(INTERVIEW_MODE), default: INTERVIEW_MODE.VIDEO },
  location: { type: String, trim: true },
  meetingLink: { type: String, trim: true },
  notes: { type: String, trim: true },
  score: { type: Number, min: 0, max: 100 },
  decision: { type: String, trim: true },
  cancelledReason: { type: String, trim: true },
  rescheduledFromId: { type: String, index: true },
  status: { type: String, enum: Object.values(INTERVIEW_STATUS), default: INTERVIEW_STATUS.SCHEDULED },
};

const interviewFeedbackFields: SchemaDefinition = {
  interviewId: { type: String, required: true, index: true },
  interviewerId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  strengths: { type: String, trim: true },
  weaknesses: { type: String, trim: true },
  recommendation: { type: String, enum: Object.values(INTERVIEW_RECOMMENDATION), required: true },
  comments: { type: String, trim: true },
};

const offerLetterFields: SchemaDefinition = {
  candidateLeadId: { type: String, required: true, index: true },
  jobRoleId: { type: String, required: true, index: true },
  departmentId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  designationId: { type: String, index: true },
  reportingManagerId: { type: String, index: true },
  salary: { type: Number, required: true, min: 0 },
  salaryBreakdown: { type: Schema.Types.Mixed, default: {} },
  currency: { type: String, default: 'INR' },
  joiningDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  documentUrl: { type: String },
  htmlContent: { type: String },
  publicId: { type: String },
  version: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: Object.values(OFFER_STATUS), default: OFFER_STATUS.DRAFT },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
};

const onboardingFields: SchemaDefinition = {
  candidateLeadId: { type: String, required: true, index: true },
  employeeId: { type: String, index: true },
  offerLetterId: { type: String, required: true, index: true },
  startDate: { type: Date, required: true },
  formData: { type: Schema.Types.Mixed, default: {} },
  completedSections: { type: [String], default: [] },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  currentSection: { type: String, trim: true },
  eSignPlaceholder: { type: String, trim: true },
  checklistItems: {
    type: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        completedBy: { type: String },
      },
    ],
    default: [],
  },
  status: { type: String, enum: Object.values(ONBOARDING_STATUS), default: ONBOARDING_STATUS.PENDING },
};

const resumeMetadataFields: SchemaDefinition = {
  candidateLeadId: { type: String, required: true, index: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  version: { type: Number, default: 1, min: 1 },
  isLatest: { type: Boolean, default: true },
  parsedData: { type: Schema.Types.Mixed, default: {} },
  skills: { type: [String], default: [] },
  experienceYears: { type: Number, min: 0 },
};

export const candidateLeadModel = defineDomainModel<CandidateLeadDocument>(
  'CandidateLead',
  COLLECTIONS.CANDIDATE_LEADS,
  candidateLeadFields,
  {
    searchFields: ['firstName', 'lastName', 'email', 'phone'],
    indexes: [
      { fields: { companyId: 1, email: 1 }, options: { name: 'idx_candidate_leads_company_email' } },
      { fields: { companyId: 1, phone: 1 }, options: { name: 'idx_candidate_leads_company_phone', sparse: true } },
      { fields: { companyId: 1, pipelineStage: 1 }, options: { name: 'idx_candidate_leads_company_pipeline' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_candidate_leads_company_status' } },
      { fields: { companyId: 1, jobRoleId: 1, pipelineStage: 1 }, options: { name: 'idx_candidate_leads_company_job_pipeline' } },
      { fields: { companyId: 1, recruiterId: 1 }, options: { name: 'idx_candidate_leads_company_recruiter' } },
    ],
  },
);

export const interviewModel = defineDomainModel<InterviewDocument>(
  'Interview',
  COLLECTIONS.INTERVIEWS,
  interviewFields,
  {
    indexes: [
      { fields: { companyId: 1, candidateLeadId: 1, scheduledAt: -1 }, options: { name: 'idx_interviews_company_candidate_date' } },
      { fields: { companyId: 1, status: 1, scheduledAt: 1 }, options: { name: 'idx_interviews_company_status_date' } },
    ],
  },
);

export const interviewFeedbackModel = defineDomainModel<InterviewFeedbackDocument>(
  'InterviewFeedback',
  COLLECTIONS.INTERVIEW_FEEDBACKS,
  interviewFeedbackFields,
  {
    indexes: [
      { fields: { companyId: 1, interviewId: 1, interviewerId: 1 }, options: { unique: true, name: 'uq_interview_feedbacks_interviewer' } },
    ],
  },
);

export const offerLetterModel = defineDomainModel<OfferLetterDocument>(
  'OfferLetter',
  COLLECTIONS.OFFER_LETTERS,
  offerLetterFields,
  {
    indexes: [
      { fields: { companyId: 1, candidateLeadId: 1 }, options: { name: 'idx_offer_letters_company_candidate' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_offer_letters_company_status' } },
    ],
  },
);

export const onboardingModel = defineDomainModel<OnboardingDocument>(
  'Onboarding',
  COLLECTIONS.ONBOARDINGS,
  onboardingFields,
  {
    indexes: [
      { fields: { companyId: 1, candidateLeadId: 1 }, options: { unique: true, name: 'uq_onboardings_company_candidate' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_onboardings_company_status' } },
    ],
  },
);

export const resumeMetadataModel = defineDomainModel<ResumeMetadataDocument>(
  'ResumeMetadata',
  COLLECTIONS.RESUME_METADATA,
  resumeMetadataFields,
  {
    indexes: [
      { fields: { companyId: 1, candidateLeadId: 1 }, options: { name: 'idx_resume_metadata_company_candidate' } },
    ],
  },
);

export const CandidateLeadModel = candidateLeadModel.model;
export const InterviewModel = interviewModel.model;
export const InterviewFeedbackModel = interviewFeedbackModel.model;
export const OfferLetterModel = offerLetterModel.model;
export const OnboardingModel = onboardingModel.model;
export const ResumeMetadataModel = resumeMetadataModel.model;

export const CandidateLeadRepository = candidateLeadModel.repository;
export const InterviewRepository = interviewModel.repository;
export const InterviewFeedbackRepository = interviewFeedbackModel.repository;
export const OfferLetterRepository = offerLetterModel.repository;
export const OnboardingRepository = onboardingModel.repository;
export const ResumeMetadataRepository = resumeMetadataModel.repository;
