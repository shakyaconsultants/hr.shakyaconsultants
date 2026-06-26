import { z } from 'zod';
import { LEAVE_DURATION_TYPE, LEAVE_POLICY_CATEGORY, HALF_DAY_SESSION } from '@domain/leave-exit/leave-exit.schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  employeeId: z.uuid().optional(),
});

export const calendarQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  employeeId: z.uuid().optional(),
});

export const createPolicySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2),
  leaveTypeId: z.uuid(),
  category: z.enum(Object.values(LEAVE_POLICY_CATEGORY) as [string, ...string[]]),
  description: z.string().optional(),
  annualQuota: z.number().min(0),
  maxConsecutiveDays: z.number().min(1).optional(),
  allowHalfDay: z.boolean().optional(),
  allowNegativeBalance: z.boolean().optional(),
  maxNegativeBalance: z.number().min(0).optional(),
  carryForwardEnabled: z.boolean().optional(),
  maxCarryForwardDays: z.number().min(0).optional(),
  carryForwardExpiryMonths: z.number().min(1).optional(),
  accrualEnabled: z.boolean().optional(),
  accrualRatePerMonth: z.number().min(0).optional(),
  requiresAttachment: z.boolean().optional(),
  allowSelfApproval: z.boolean().optional(),
  minNoticeDays: z.number().min(0).optional(),
  emergencyLeaveAllowed: z.boolean().optional(),
  applicableDepartmentIds: z.array(z.uuid()).optional(),
  applicableBranchIds: z.array(z.uuid()).optional(),
  workflowSlug: z.string().optional(),
});

export const applyLeaveSchema = z.object({
  employeeId: z.uuid(),
  leavePolicyId: z.uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  durationType: z.enum(Object.values(LEAVE_DURATION_TYPE) as [string, ...string[]]),
  halfDaySession: z.enum(Object.values(HALF_DAY_SESSION) as [string, ...string[]]).optional(),
  reason: z.string().min(1),
  isEmergency: z.boolean().optional(),
  submit: z.boolean().optional(),
});

export const submitResignationSchema = z.object({
  employeeId: z.uuid(),
  reason: z.string().min(1),
  noticePeriodDays: z.number().int().min(0),
  expectedLastWorkingDay: z.coerce.date(),
  comments: z.string().optional(),
});

export const completeChecklistSchema = z.object({ notes: z.string().optional() });

export const balanceAdjustSchema = z.object({
  employeeId: z.uuid(),
  leavePolicyId: z.uuid(),
  amount: z.number(),
  notes: z.string().min(1),
});
