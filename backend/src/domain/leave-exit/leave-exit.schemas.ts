import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const LEAVE_REQUEST_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  WITHDRAWN: 'withdrawn',
} as const;

export const LEAVE_DURATION_TYPE = {
  FULL_DAY: 'full_day',
  HALF_DAY: 'half_day',
  MULTI_DAY: 'multi_day',
} as const;

export const HALF_DAY_SESSION = {
  FIRST_HALF: 'first_half',
  SECOND_HALF: 'second_half',
} as const;

export const LEAVE_POLICY_CATEGORY = {
  ANNUAL: 'annual',
  CASUAL: 'casual',
  SICK: 'sick',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  COMP_OFF: 'comp_off',
  WORK_FROM_HOME: 'work_from_home',
  LOSS_OF_PAY: 'loss_of_pay',
  CUSTOM: 'custom',
} as const;

export const RESIGNATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export const EXIT_CHECKLIST_ITEM_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  WAIVED: 'waived',
} as const;

export const EXIT_PROCESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const EXIT_CHECKLIST_CATEGORY = {
  HR_CLEARANCE: 'hr_clearance',
  IT_ASSET_RETURN: 'it_asset_return',
  FINANCE_CLEARANCE: 'finance_clearance',
  ADMIN_CLEARANCE: 'admin_clearance',
  MANAGER_HANDOVER: 'manager_handover',
  DOCUMENT_COLLECTION: 'document_collection',
  EXPERIENCE_LETTER: 'experience_letter',
  RELIEVING_LETTER: 'relieving_letter',
} as const;

export interface LeavePolicyDocument extends BaseDocument {
  name: string;
  code: string;
  leaveTypeId: string;
  category: string;
  description?: string;
  annualQuota: number;
  maxConsecutiveDays?: number;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  maxNegativeBalance?: number;
  carryForwardEnabled: boolean;
  maxCarryForwardDays?: number;
  carryForwardExpiryMonths?: number;
  accrualEnabled: boolean;
  accrualRatePerMonth?: number;
  requiresAttachment: boolean;
  allowSelfApproval: boolean;
  minNoticeDays: number;
  emergencyLeaveAllowed: boolean;
  applicableDepartmentIds: string[];
  applicableBranchIds: string[];
  workflowSlug?: string;
  status: string;
}

export interface LeaveBalanceDocument extends BaseDocument {
  employeeId: string;
  leavePolicyId: string;
  leaveTypeId: string;
  year: number;
  openingBalance: number;
  earned: number;
  used: number;
  pending: number;
  available: number;
  carryForward: number;
  expiryDate?: Date;
}

export interface LeaveBalanceLedgerDocument extends BaseDocument {
  employeeId: string;
  leavePolicyId: string;
  leaveTypeId: string;
  entryType: string;
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  occurredAt: Date;
}

export interface LeaveRequestDocument extends BaseDocument {
  employeeId: string;
  leavePolicyId: string;
  leaveTypeId: string;
  approvalRequestId?: string;
  startDate: Date;
  endDate: Date;
  durationType: string;
  halfDaySession?: string;
  totalDays: number;
  reason: string;
  isEmergency: boolean;
  status: string;
  attachmentIds: string[];
}

export interface ResignationDocument extends BaseDocument {
  employeeId: string;
  approvalRequestId?: string;
  reason: string;
  noticePeriodDays: number;
  expectedLastWorkingDay: Date;
  submittedAt?: Date;
  acceptedAt?: Date;
  status: string;
  attachmentIds: string[];
  comments?: string;
}

export interface ExitChecklistTemplateDocument extends BaseDocument {
  name: string;
  slug: string;
  category: string;
  description?: string;
  sortOrder: number;
  isRequired: boolean;
  assigneeRoleSlug?: string;
  status: string;
}

export interface ExitProcessDocument extends BaseDocument {
  employeeId: string;
  resignationId: string;
  approvalRequestId?: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  expectedLastWorkingDay: Date;
}

export interface ExitChecklistItemDocument extends BaseDocument {
  exitProcessId: string;
  templateId?: string;
  category: string;
  title: string;
  description?: string;
  sortOrder: number;
  isRequired: boolean;
  assigneeEmployeeId?: string;
  status: string;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface FullFinalPreparationDocument extends BaseDocument {
  employeeId: string;
  exitProcessId: string;
  resignationId: string;
  pendingLeaveDays: number;
  pendingSalaryAmount?: number;
  assetIds: string[];
  noticeRecoveryDays: number;
  bonusAmount?: number;
  metadata: Record<string, unknown>;
  preparedAt: Date;
  status: string;
}

export interface SecureAccessTokenDocument extends BaseDocument {
  tokenHash: string;
  purpose: string;
  entityType: string;
  entityId: string;
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  metadata: Record<string, unknown>;
  createdByUserId: string;
}

const leavePolicyFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  leaveTypeId: { type: String, required: true, index: true },
  category: { type: String, enum: Object.values(LEAVE_POLICY_CATEGORY), required: true },
  description: { type: String, trim: true },
  annualQuota: { type: Number, required: true, min: 0 },
  maxConsecutiveDays: { type: Number, min: 1 },
  allowHalfDay: { type: Boolean, default: true },
  allowNegativeBalance: { type: Boolean, default: false },
  maxNegativeBalance: { type: Number, min: 0 },
  carryForwardEnabled: { type: Boolean, default: false },
  maxCarryForwardDays: { type: Number, min: 0 },
  carryForwardExpiryMonths: { type: Number, min: 1 },
  accrualEnabled: { type: Boolean, default: false },
  accrualRatePerMonth: { type: Number, min: 0 },
  requiresAttachment: { type: Boolean, default: false },
  allowSelfApproval: { type: Boolean, default: false },
  minNoticeDays: { type: Number, default: 0, min: 0 },
  emergencyLeaveAllowed: { type: Boolean, default: true },
  applicableDepartmentIds: { type: [String], default: [] },
  applicableBranchIds: { type: [String], default: [] },
  workflowSlug: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const leaveBalanceFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  leavePolicyId: { type: String, required: true, index: true },
  leaveTypeId: { type: String, required: true, index: true },
  year: { type: Number, required: true, index: true },
  openingBalance: { type: Number, default: 0 },
  earned: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  available: { type: Number, default: 0 },
  carryForward: { type: Number, default: 0 },
  expiryDate: { type: Date },
};

const leaveBalanceLedgerFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  leavePolicyId: { type: String, required: true, index: true },
  leaveTypeId: { type: String, required: true, index: true },
  entryType: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  referenceType: { type: String, trim: true },
  referenceId: { type: String, index: true },
  notes: { type: String, trim: true },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
};

const leaveRequestFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  leavePolicyId: { type: String, required: true, index: true },
  leaveTypeId: { type: String, required: true, index: true },
  approvalRequestId: { type: String, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  durationType: { type: String, enum: Object.values(LEAVE_DURATION_TYPE), default: LEAVE_DURATION_TYPE.FULL_DAY },
  halfDaySession: { type: String, enum: Object.values(HALF_DAY_SESSION) },
  totalDays: { type: Number, required: true, min: 0.5 },
  reason: { type: String, required: true, trim: true },
  isEmergency: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(LEAVE_REQUEST_STATUS), default: LEAVE_REQUEST_STATUS.DRAFT, index: true },
  attachmentIds: { type: [String], default: [] },
};

const resignationFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  approvalRequestId: { type: String, index: true },
  reason: { type: String, required: true, trim: true },
  noticePeriodDays: { type: Number, required: true, min: 0 },
  expectedLastWorkingDay: { type: Date, required: true, index: true },
  submittedAt: { type: Date },
  acceptedAt: { type: Date },
  status: { type: String, enum: Object.values(RESIGNATION_STATUS), default: RESIGNATION_STATUS.DRAFT, index: true },
  attachmentIds: { type: [String], default: [] },
  comments: { type: String, trim: true },
};

const exitChecklistTemplateFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  category: { type: String, enum: Object.values(EXIT_CHECKLIST_CATEGORY), required: true },
  description: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 },
  isRequired: { type: Boolean, default: true },
  assigneeRoleSlug: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const exitProcessFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  resignationId: { type: String, required: true, index: true },
  approvalRequestId: { type: String, index: true },
  status: { type: String, enum: Object.values(EXIT_PROCESS_STATUS), default: EXIT_PROCESS_STATUS.NOT_STARTED, index: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
  expectedLastWorkingDay: { type: Date, required: true },
};

const exitChecklistItemFields: SchemaDefinition = {
  exitProcessId: { type: String, required: true, index: true },
  templateId: { type: String, index: true },
  category: { type: String, enum: Object.values(EXIT_CHECKLIST_CATEGORY), required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 },
  isRequired: { type: Boolean, default: true },
  assigneeEmployeeId: { type: String, index: true },
  status: { type: String, enum: Object.values(EXIT_CHECKLIST_ITEM_STATUS), default: EXIT_CHECKLIST_ITEM_STATUS.PENDING, index: true },
  completedAt: { type: Date },
  completedBy: { type: String },
  notes: { type: String, trim: true },
};

const fullFinalPreparationFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  exitProcessId: { type: String, required: true, index: true },
  resignationId: { type: String, required: true, index: true },
  pendingLeaveDays: { type: Number, default: 0 },
  pendingSalaryAmount: { type: Number, min: 0 },
  assetIds: { type: [String], default: [] },
  noticeRecoveryDays: { type: Number, default: 0, min: 0 },
  bonusAmount: { type: Number, min: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  preparedAt: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.PENDING },
};

const secureAccessTokenFields: SchemaDefinition = {
  tokenHash: { type: String, required: true, index: true, select: false },
  purpose: { type: String, required: true, trim: true, index: true },
  entityType: { type: String, required: true, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date },
  revokedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdByUserId: { type: String, required: true },
};

export const leavePolicyModel = defineDomainModel<LeavePolicyDocument>(
  'LeavePolicy',
  COLLECTIONS.LEAVE_POLICIES,
  leavePolicyFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_leave_policies_code' } },
    ],
  },
);

export const leaveBalanceModel = defineDomainModel<LeaveBalanceDocument>(
  'LeaveBalance',
  COLLECTIONS.LEAVE_BALANCES,
  leaveBalanceFields,
  {
    indexes: [
      {
        fields: { companyId: 1, employeeId: 1, leavePolicyId: 1, year: 1 },
        options: { unique: true, name: 'uq_leave_balances_employee_policy_year' },
      },
    ],
  },
);

export const leaveBalanceLedgerModel = defineDomainModel<LeaveBalanceLedgerDocument>(
  'LeaveBalanceLedger',
  COLLECTIONS.LEAVE_BALANCE_LEDGER,
  leaveBalanceLedgerFields,
  {
    withSoftDelete: false,
    indexes: [
      { fields: { companyId: 1, employeeId: 1, occurredAt: -1 }, options: { name: 'idx_leave_balance_ledger_employee_date' } },
    ],
  },
);

export const leaveRequestModel = defineDomainModel<LeaveRequestDocument>(
  'LeaveRequest',
  COLLECTIONS.LEAVE_REQUESTS,
  leaveRequestFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, status: 1 }, options: { name: 'idx_leave_requests_employee_status' } },
      { fields: { companyId: 1, startDate: 1, endDate: 1 }, options: { name: 'idx_leave_requests_date_range' } },
    ],
  },
);

export const resignationModel = defineDomainModel<ResignationDocument>(
  'Resignation',
  COLLECTIONS.RESIGNATIONS,
  resignationFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, status: 1 }, options: { name: 'idx_resignations_employee_status' } },
    ],
  },
);

export const exitChecklistTemplateModel = defineDomainModel<ExitChecklistTemplateDocument>(
  'ExitChecklistTemplate',
  COLLECTIONS.EXIT_CHECKLIST_TEMPLATES,
  exitChecklistTemplateFields,
  {
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_exit_checklist_templates_slug' } },
    ],
  },
);

export const exitProcessModel = defineDomainModel<ExitProcessDocument>(
  'ExitProcess',
  COLLECTIONS.EXIT_PROCESSES,
  exitProcessFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_exit_processes_employee' } },
    ],
  },
);

export const exitChecklistItemModel = defineDomainModel<ExitChecklistItemDocument>(
  'ExitChecklistItem',
  COLLECTIONS.EXIT_CHECKLIST_ITEMS,
  exitChecklistItemFields,
  {
    indexes: [
      { fields: { companyId: 1, exitProcessId: 1, sortOrder: 1 }, options: { name: 'idx_exit_checklist_items_process' } },
    ],
  },
);

export const fullFinalPreparationModel = defineDomainModel<FullFinalPreparationDocument>(
  'FullFinalPreparation',
  COLLECTIONS.FULL_FINAL_PREPARATIONS,
  fullFinalPreparationFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { unique: true, name: 'uq_full_final_preparations_employee' } },
    ],
  },
);

export const secureAccessTokenModel = defineDomainModel<SecureAccessTokenDocument>(
  'SecureAccessToken',
  COLLECTIONS.SECURE_ACCESS_TOKENS,
  secureAccessTokenFields,
  {
    withSoftDelete: false,
    indexes: [
      { fields: { companyId: 1, purpose: 1, entityType: 1, entityId: 1 }, options: { name: 'idx_secure_access_tokens_entity' } },
      { fields: { companyId: 1, tokenHash: 1 }, options: { unique: true, name: 'uq_secure_access_tokens_hash' } },
    ],
  },
);

export const LeavePolicyRepository = leavePolicyModel.repository;
export const LeaveBalanceRepository = leaveBalanceModel.repository;
export const LeaveBalanceLedgerRepository = leaveBalanceLedgerModel.repository;
export const LeaveRequestRepository = leaveRequestModel.repository;
export const ResignationRepository = resignationModel.repository;
export const ExitChecklistTemplateRepository = exitChecklistTemplateModel.repository;
export const ExitProcessRepository = exitProcessModel.repository;
export const ExitChecklistItemRepository = exitChecklistItemModel.repository;
export const FullFinalPreparationRepository = fullFinalPreparationModel.repository;
export const SecureAccessTokenRepository = secureAccessTokenModel.repository;
export const SecureAccessTokenModel = secureAccessTokenModel.model;
