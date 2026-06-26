import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const EMPLOYEE_TIMELINE_EVENT = {
  CREATED: 'created',
  JOINED: 'joined',
  PROMOTION: 'promotion',
  DEPARTMENT_TRANSFER: 'department_transfer',
  ROLE_CHANGE: 'role_change',
  SALARY_CHANGE: 'salary_change',
  MANAGER_CHANGE: 'manager_change',
  DOCUMENT_UPLOAD: 'document_upload',
  TERMINATION: 'termination',
  RESIGNATION: 'resignation',
  ARCHIVED: 'archived',
  RESTORED: 'restored',
  DEACTIVATED: 'deactivated',
  REACTIVATED: 'reactivated',
  PROBATION_CONFIRMED: 'probation_confirmed',
  OTHER: 'other',
} as const;

export const SKILL_LEVEL = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

export const BANK_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const DOCUMENT_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export interface AddressFields {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmployeeTimelineDocument extends BaseDocument {
  employeeId: string;
  eventType: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  actorId: string;
}

export interface EmployeeSkillDocument extends BaseDocument {
  employeeId: string;
  skillId: string;
  skillName: string;
  level: string;
  yearsExperience: number;
  isPrimary: boolean;
  isSecondary: boolean;
}

export interface EmployeeCertificationDocument extends BaseDocument {
  employeeId: string;
  name: string;
  issuedBy: string;
  issuedAt: Date;
  expiresAt?: Date;
  credentialId?: string;
  documentId?: string;
  reminderEnabled: boolean;
  status: string;
}

export interface SequenceDocument extends BaseDocument {
  key: string;
  value: number;
  prefix?: string;
}

const employeeTimelineFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, trim: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  metadata: { type: Object, default: {} },
  occurredAt: { type: Date, required: true, index: true },
  actorId: { type: String, required: true },
};

const employeeSkillFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  skillId: { type: String, required: true, index: true },
  skillName: { type: String, required: true, trim: true },
  level: { type: String, enum: Object.values(SKILL_LEVEL), default: SKILL_LEVEL.INTERMEDIATE },
  yearsExperience: { type: Number, default: 0, min: 0 },
  isPrimary: { type: Boolean, default: false },
  isSecondary: { type: Boolean, default: false },
};

const employeeCertificationFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  issuedBy: { type: String, required: true, trim: true },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, index: true },
  credentialId: { type: String, trim: true },
  documentId: { type: String, index: true },
  reminderEnabled: { type: Boolean, default: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const sequenceFields: SchemaDefinition = {
  key: { type: String, required: true, trim: true },
  value: { type: Number, required: true, default: 0, min: 0 },
  prefix: { type: String, trim: true, uppercase: true },
};

export const employeeTimelineModel = defineDomainModel<EmployeeTimelineDocument>(
  'EmployeeTimeline',
  COLLECTIONS.EMPLOYEE_TIMELINE,
  employeeTimelineFields,
  {
    withSoftDelete: false,
    indexes: [
      { fields: { companyId: 1, employeeId: 1, occurredAt: -1 }, options: { name: 'idx_employee_timeline_company_employee_date' } },
      { fields: { companyId: 1, employeeId: 1, eventType: 1 }, options: { name: 'idx_employee_timeline_company_employee_type' } },
    ],
  },
);

export const employeeSkillModel = defineDomainModel<EmployeeSkillDocument>(
  'EmployeeSkill',
  COLLECTIONS.EMPLOYEE_SKILLS,
  employeeSkillFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, skillId: 1 }, options: { unique: true, name: 'uq_employee_skills_company_employee_skill' } },
    ],
  },
);

export const employeeCertificationModel = defineDomainModel<EmployeeCertificationDocument>(
  'EmployeeCertification',
  COLLECTIONS.EMPLOYEE_CERTIFICATIONS,
  employeeCertificationFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_employee_certifications_company_employee' } },
      { fields: { companyId: 1, expiresAt: 1 }, options: { name: 'idx_employee_certifications_company_expiry', sparse: true } },
    ],
  },
);

export const sequenceModel = defineDomainModel<SequenceDocument>(
  'Sequence',
  COLLECTIONS.SEQUENCES,
  sequenceFields,
  {
    withSoftDelete: false,
    withVersioning: false,
    indexes: [
      { fields: { companyId: 1, key: 1 }, options: { unique: true, name: 'uq_sequences_company_key' } },
    ],
  },
);

export const EmployeeTimelineModel = employeeTimelineModel.model;
export const EmployeeSkillModel = employeeSkillModel.model;
export const EmployeeCertificationModel = employeeCertificationModel.model;
export const SequenceModel = sequenceModel.model;

export const EmployeeTimelineRepository = employeeTimelineModel.repository;
export const EmployeeSkillRepository = employeeSkillModel.repository;
export const EmployeeCertificationRepository = employeeCertificationModel.repository;
export const SequenceRepository = sequenceModel.repository;
