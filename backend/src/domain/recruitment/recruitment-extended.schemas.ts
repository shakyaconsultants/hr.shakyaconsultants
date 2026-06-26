import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const PIPELINE_STAGE = {
  LEAD: 'lead',
  APPLIED: 'applied',
  RESUME_SCREENING: 'resume_screening',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  ONBOARDING: 'onboarding',
  EMPLOYEE_CONVERTED: 'employee_converted',
} as const;

export const INTERVIEW_TYPE = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  TECHNICAL: 'technical',
  HR: 'hr',
  MANAGERIAL: 'managerial',
  PANEL: 'panel',
} as const;

export const CANDIDATE_TIMELINE_EVENT = {
  CREATED: 'created',
  RESUME_UPLOADED: 'resume_uploaded',
  STATUS_CHANGED: 'status_changed',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_RESCHEDULED: 'interview_rescheduled',
  INTERVIEW_CANCELLED: 'interview_cancelled',
  INTERVIEW_COMPLETED: 'interview_completed',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_UPDATED: 'onboarding_updated',
  CONVERTED: 'converted',
  MERGED: 'merged',
  ARCHIVED: 'archived',
  RESTORED: 'restored',
  RECRUITER_ASSIGNED: 'recruiter_assigned',
} as const;

export const RECRUITMENT_ACTIVITY_TYPE = {
  CANDIDATE_CREATED: 'candidate.created',
  INTERVIEW_SCHEDULED: 'interview.scheduled',
  OFFER_ACCEPTED: 'offer.accepted',
  EMPLOYEE_CONVERTED: 'employee.converted',
  RECRUITER_ASSIGNED: 'recruiter.assigned',
  PIPELINE_CHANGED: 'pipeline.changed',
} as const;

export const ONBOARDING_SECTION = {
  PERSONAL: 'personal',
  ADDRESS: 'address',
  EMERGENCY_CONTACT: 'emergency_contact',
  BANK_DETAILS: 'bank_details',
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  PHOTO: 'photo',
  TENTH: '10th',
  TWELFTH: '12th',
  GRADUATION: 'graduation',
  EXPERIENCE: 'experience',
  DOCUMENTS: 'documents',
  ESIGN: 'esign',
} as const;

export interface CandidateTimelineDocument extends BaseDocument {
  candidateLeadId: string;
  eventType: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  actorId: string;
}

export interface PipelineStageConfigDocument extends BaseDocument {
  slug: string;
  name: string;
  sortOrder: number;
  isTerminal: boolean;
  isDefault: boolean;
  status: string;
}

export interface PipelineTransitionDocument extends BaseDocument {
  candidateLeadId: string;
  fromStage: string;
  toStage: string;
  reason?: string;
  actorId: string;
  transitionedAt: Date;
}

const candidateTimelineFields: SchemaDefinition = {
  candidateLeadId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, trim: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  metadata: { type: Object, default: {} },
  occurredAt: { type: Date, required: true, index: true },
  actorId: { type: String, required: true },
};

const pipelineStageConfigFields: SchemaDefinition = {
  slug: { type: String, required: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isTerminal: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const pipelineTransitionFields: SchemaDefinition = {
  candidateLeadId: { type: String, required: true, index: true },
  fromStage: { type: String, required: true, trim: true },
  toStage: { type: String, required: true, trim: true },
  reason: { type: String, trim: true },
  actorId: { type: String, required: true },
  transitionedAt: { type: Date, required: true, default: Date.now },
};

export const candidateTimelineModel = defineDomainModel<CandidateTimelineDocument>(
  'CandidateTimeline',
  COLLECTIONS.CANDIDATE_TIMELINE,
  candidateTimelineFields,
  {
    withSoftDelete: false,
    indexes: [
      { fields: { companyId: 1, candidateLeadId: 1, occurredAt: -1 }, options: { name: 'idx_candidate_timeline_company_candidate_date' } },
    ],
  },
);

export const pipelineStageConfigModel = defineDomainModel<PipelineStageConfigDocument>(
  'PipelineStageConfig',
  COLLECTIONS.RECRUITMENT_PIPELINE_STAGES,
  pipelineStageConfigFields,
  {
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_pipeline_stages_company_slug' } },
      { fields: { companyId: 1, sortOrder: 1 }, options: { name: 'idx_pipeline_stages_company_sort' } },
    ],
  },
);

export const pipelineTransitionModel = defineDomainModel<PipelineTransitionDocument>(
  'PipelineTransition',
  COLLECTIONS.PIPELINE_TRANSITIONS,
  pipelineTransitionFields,
  {
    withSoftDelete: false,
    indexes: [
      { fields: { companyId: 1, candidateLeadId: 1, transitionedAt: -1 }, options: { name: 'idx_pipeline_transitions_company_candidate' } },
    ],
  },
);

export const CandidateTimelineModel = candidateTimelineModel.model;
export const PipelineStageConfigModel = pipelineStageConfigModel.model;
export const PipelineTransitionModel = pipelineTransitionModel.model;

export const CandidateTimelineRepository = candidateTimelineModel.repository;
export const PipelineStageConfigRepository = pipelineStageConfigModel.repository;
export const PipelineTransitionRepository = pipelineTransitionModel.repository;
