import { z } from 'zod';
import { ATTENDANCE_LOG_TYPE } from '@domain/attendance/attendance.schemas.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import {
  ATTENDANCE_REPORT_PERIOD,
  ATTENDANCE_REPORT_SCOPE,
} from '@modules/attendance/constants/attendance.constants.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const listRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  employeeId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const calendarQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  employeeId: z.uuid().optional(),
});

export const punchSchema = z.object({
  type: z.enum(Object.values(ATTENDANCE_LOG_TYPE) as [string, ...string[]]),
  employeeId: z.uuid().optional(),
  timestamp: z.coerce.date().optional(),
  location: z.string().optional(),
  deviceInfo: z.string().optional(),
});

export const externalPunchSchema = z.object({
  externalId: z.string().min(1).max(128),
  employeeNumber: z.string().min(1).max(64),
  type: z.enum([ATTENDANCE_LOG_TYPE.CHECK_IN, ATTENDANCE_LOG_TYPE.CHECK_OUT]),
  timestamp: z.coerce.date(),
  deviceCode: z.string().max(64).optional(),
  location: z.string().max(256).optional(),
});

export const updatePoliciesSchema = z.object({
  graceMinutes: z.number().min(0).optional(),
  lateThresholdMinutes: z.number().min(0).optional(),
  earlyExitThresholdMinutes: z.number().min(0).optional(),
  overtimeThresholdMinutes: z.number().min(0).optional(),
  halfDayThresholdMinutes: z.number().min(0).optional(),
  weeklyOffDays: z.array(z.number().int().min(0).max(6)).optional(),
  correctionWorkflowSlug: z.string().optional(),
});

export const createShiftAssignmentSchema = z.object({
  employeeId: z.uuid(),
  workShiftId: z.uuid(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export const updateShiftAssignmentSchema = z.object({
  workShiftId: z.uuid().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
  status: z.string().optional(),
});

export const createCorrectionSchema = z.object({
  attendanceId: z.uuid(),
  adjustedStatus: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]),
  reason: z.string().min(1),
  requestedCheckIn: z.coerce.date().optional(),
  requestedCheckOut: z.coerce.date().optional(),
  submit: z.boolean().optional(),
});

export const listCorrectionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  employeeId: z.uuid().optional(),
  status: z.string().optional(),
});

export const reportQuerySchema = z.object({
  period: z.enum(Object.values(ATTENDANCE_REPORT_PERIOD) as [string, ...string[]]),
  scope: z.enum(Object.values(ATTENDANCE_REPORT_SCOPE) as [string, ...string[]]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  employeeId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
});

export const monthlyProcessingSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
});

export const overrideRecordSchema = z.object({
  attendanceId: z.uuid(),
  status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]).optional(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  notes: z.string().optional(),
  reason: z.string().min(1),
});

export const teamQuerySchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const exceptionsQuerySchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
});
