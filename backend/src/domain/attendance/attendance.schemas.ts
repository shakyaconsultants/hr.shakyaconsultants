import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import {
  ATTENDANCE_STATUS,
  ENTITY_STATUS,
  LEAVE_STATUS,
} from '@shared/constants/status.constants.js';

export const ATTENDANCE_LOG_TYPE = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
  BREAK_START: 'break_start',
  BREAK_END: 'break_end',
} as const;

export const ATTENDANCE_LOG_SOURCE = {
  MANUAL: 'manual',
  EXTERNAL: 'external',
} as const;

export const ATTENDANCE_CORRECTION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export interface AttendancePayrollSnapshot {
  processedAt?: Date;
  processedMonth?: string;
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
  halfDays?: number;
  overtimeMinutes?: number;
  payableDays?: number;
  lopDays?: number;
  [key: string]: unknown;
}

export interface AttendanceDocument extends BaseDocument {
  employeeId: string;
  date: Date;
  status: string;
  shiftId?: string;
  departmentId?: string;
  branchId?: string;
  checkIn?: Date;
  checkOut?: Date;
  workedMinutes?: number;
  breakMinutes?: number;
  lateMinutes?: number;
  earlyExitMinutes?: number;
  overtimeMinutes?: number;
  isWeekend?: boolean;
  isHoliday?: boolean;
  payrollSnapshot?: AttendancePayrollSnapshot;
  notes?: string;
}

export interface AttendanceLogDocument extends BaseDocument {
  attendanceId: string;
  employeeId: string;
  type: string;
  timestamp: Date;
  location?: string;
  ipAddress?: string;
  deviceInfo?: string;
  source?: string;
  externalId?: string;
  deviceCode?: string;
}

export interface ShiftDocument extends BaseDocument {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  gracePeriodMinutes: number;
  status: string;
}

export interface ShiftAssignmentDocument extends BaseDocument {
  employeeId: string;
  workShiftId: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: string;
}

export interface AttendanceAdjustmentDocument extends BaseDocument {
  attendanceId: string;
  employeeId: string;
  originalStatus: string;
  adjustedStatus: string;
  reason: string;
  adjustedBy: string;
  approvedAt?: Date;
  approvalRequestId?: string;
  status?: string;
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
}

export interface AttendanceApprovalDocument extends BaseDocument {
  attendanceAdjustmentId?: string;
  employeeId: string;
  approverId: string;
  status: string;
  comments?: string;
  decidedAt?: Date;
}

const attendanceFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.ABSENT,
  },
  shiftId: { type: String, index: true },
  departmentId: { type: String, index: true },
  branchId: { type: String, index: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workedMinutes: { type: Number, min: 0 },
  breakMinutes: { type: Number, min: 0, default: 0 },
  lateMinutes: { type: Number, min: 0, default: 0 },
  earlyExitMinutes: { type: Number, min: 0, default: 0 },
  overtimeMinutes: { type: Number, min: 0, default: 0 },
  isWeekend: { type: Boolean, default: false },
  isHoliday: { type: Boolean, default: false },
  payrollSnapshot: { type: Schema.Types.Mixed, default: {} },
  notes: { type: String, trim: true },
};

const attendanceLogFields: SchemaDefinition = {
  attendanceId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(ATTENDANCE_LOG_TYPE), required: true },
  timestamp: { type: Date, required: true, index: true },
  location: { type: String, trim: true },
  ipAddress: { type: String, trim: true },
  deviceInfo: { type: String, trim: true },
  source: {
    type: String,
    enum: Object.values(ATTENDANCE_LOG_SOURCE),
    default: ATTENDANCE_LOG_SOURCE.MANUAL,
  },
  externalId: { type: String, trim: true, sparse: true },
  deviceCode: { type: String, trim: true },
};

const shiftFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakMinutes: { type: Number, default: 0, min: 0 },
  gracePeriodMinutes: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const shiftAssignmentFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  workShiftId: { type: String, required: true, index: true },
  effectiveFrom: { type: Date, required: true, index: true },
  effectiveTo: { type: Date, index: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const attendanceAdjustmentFields: SchemaDefinition = {
  attendanceId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  originalStatus: { type: String, enum: Object.values(ATTENDANCE_STATUS), required: true },
  adjustedStatus: { type: String, enum: Object.values(ATTENDANCE_STATUS), required: true },
  reason: { type: String, required: true, trim: true },
  adjustedBy: { type: String, required: true },
  approvedAt: { type: Date },
  approvalRequestId: { type: String, index: true },
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_CORRECTION_STATUS),
    default: ATTENDANCE_CORRECTION_STATUS.DRAFT,
  },
  requestedCheckIn: { type: Date },
  requestedCheckOut: { type: Date },
};

const attendanceApprovalFields: SchemaDefinition = {
  attendanceAdjustmentId: { type: String, index: true },
  employeeId: { type: String, required: true, index: true },
  approverId: { type: String, required: true, index: true },
  status: { type: String, enum: Object.values(LEAVE_STATUS), default: LEAVE_STATUS.PENDING },
  comments: { type: String, trim: true },
  decidedAt: { type: Date },
};

export const attendanceModel = defineDomainModel<AttendanceDocument>(
  'Attendance',
  COLLECTIONS.ATTENDANCES,
  attendanceFields,
  {
    indexes: [
      {
        fields: { companyId: 1, employeeId: 1, date: 1 },
        options: { unique: true, name: 'uq_attendances_company_employee_date' },
      },
      {
        fields: { companyId: 1, date: 1, status: 1 },
        options: { name: 'idx_attendances_company_date_status' },
      },
      {
        fields: { companyId: 1, departmentId: 1, date: 1 },
        options: { name: 'idx_attendances_company_dept_date' },
      },
      {
        fields: { companyId: 1, branchId: 1, date: 1 },
        options: { name: 'idx_attendances_company_branch_date' },
      },
    ],
  },
);

export const attendanceLogModel = defineDomainModel<AttendanceLogDocument>(
  'AttendanceLog',
  COLLECTIONS.ATTENDANCE_LOGS,
  attendanceLogFields,
  {
    indexes: [
      {
        fields: { companyId: 1, attendanceId: 1, timestamp: -1 },
        options: { name: 'idx_attendance_logs_company_attendance_time' },
      },
      {
        fields: { companyId: 1, employeeId: 1, timestamp: -1 },
        options: { name: 'idx_attendance_logs_company_employee_time' },
      },
      {
        fields: { companyId: 1, externalId: 1 },
        options: { unique: true, sparse: true, name: 'uq_attendance_logs_company_external_id' },
      },
    ],
  },
);

export const shiftModel = defineDomainModel<ShiftDocument>(
  'Shift',
  COLLECTIONS.SHIFTS,
  shiftFields,
  {
    indexes: [
      {
        fields: { companyId: 1, code: 1 },
        options: { unique: true, name: 'uq_shifts_company_code' },
      },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_shifts_company_status' } },
    ],
  },
);

export const shiftAssignmentModel = defineDomainModel<ShiftAssignmentDocument>(
  'ShiftAssignment',
  COLLECTIONS.SHIFT_ASSIGNMENTS,
  shiftAssignmentFields,
  {
    indexes: [
      {
        fields: { companyId: 1, employeeId: 1, effectiveFrom: -1 },
        options: { name: 'idx_shift_assignments_company_employee_from' },
      },
      {
        fields: { companyId: 1, workShiftId: 1, status: 1 },
        options: { name: 'idx_shift_assignments_company_shift_status' },
      },
    ],
  },
);

export const attendanceAdjustmentModel = defineDomainModel<AttendanceAdjustmentDocument>(
  'AttendanceAdjustment',
  COLLECTIONS.ATTENDANCE_ADJUSTMENTS,
  attendanceAdjustmentFields,
  {
    indexes: [
      {
        fields: { companyId: 1, attendanceId: 1 },
        options: { name: 'idx_attendance_adjustments_company_attendance' },
      },
      {
        fields: { companyId: 1, employeeId: 1, createdAt: -1 },
        options: { name: 'idx_attendance_adjustments_company_employee_date' },
      },
    ],
  },
);

export const attendanceApprovalModel = defineDomainModel<AttendanceApprovalDocument>(
  'AttendanceApproval',
  COLLECTIONS.ATTENDANCE_APPROVALS,
  attendanceApprovalFields,
  {
    indexes: [
      {
        fields: { companyId: 1, approverId: 1, status: 1 },
        options: { name: 'idx_attendance_approvals_company_approver_status' },
      },
      {
        fields: { companyId: 1, employeeId: 1, status: 1 },
        options: { name: 'idx_attendance_approvals_company_employee_status' },
      },
    ],
  },
);

export const AttendanceModel = attendanceModel.model;
export const AttendanceLogModel = attendanceLogModel.model;
export const ShiftModel = shiftModel.model;
export const ShiftAssignmentModel = shiftAssignmentModel.model;
export const AttendanceAdjustmentModel = attendanceAdjustmentModel.model;
export const AttendanceApprovalModel = attendanceApprovalModel.model;

export const AttendanceRepository = attendanceModel.repository;
export const AttendanceLogRepository = attendanceLogModel.repository;
export const ShiftRepository = shiftModel.repository;
export const ShiftAssignmentRepository = shiftAssignmentModel.repository;
export const AttendanceAdjustmentRepository = attendanceAdjustmentModel.repository;
export const AttendanceApprovalRepository = attendanceApprovalModel.repository;
