import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';

export interface ApprovalActorContext {
  companyId: string;
  userId: string;
  employeeId?: string;
  ip?: string;
  userAgent?: string;
}

export interface ApprovalListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  requestType?: string;
  entityType?: string;
  search?: string;
}

export function buildApprovalActor(req: AuthenticatedRequest): ApprovalActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  };
}

export type LeaveExitActorContext = ApprovalActorContext;
export type AttendanceActorContext = ApprovalActorContext;
export type PayrollActorContext = ApprovalActorContext;
export type SalesActorContext = ApprovalActorContext;
export type CommunicationActorContext = ApprovalActorContext;
export type ReportsActorContext = ApprovalActorContext;
export type IntegrationActorContext = ApprovalActorContext;

export function buildLeaveExitActor(req: AuthenticatedRequest): LeaveExitActorContext {
  return buildApprovalActor(req);
}

export function buildAttendanceActor(req: AuthenticatedRequest): AttendanceActorContext {
  return buildApprovalActor(req);
}

export function buildPayrollActor(req: AuthenticatedRequest): PayrollActorContext {
  return buildApprovalActor(req);
}

export function buildSalesActor(req: AuthenticatedRequest): SalesActorContext {
  return buildApprovalActor(req);
}

export function buildCommunicationActor(req: AuthenticatedRequest): CommunicationActorContext {
  return buildApprovalActor(req);
}

export function buildReportsActor(req: AuthenticatedRequest): ReportsActorContext {
  return buildApprovalActor(req);
}

export function buildIntegrationActor(req: AuthenticatedRequest): IntegrationActorContext {
  return buildApprovalActor(req);
}
