import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { buildLeaveExitActor } from '@modules/approval/types/approval.types.js';
import { LeavePolicyService } from '@modules/leave-exit/services/leave-policy.service.js';
import { LeaveBalanceService } from '@modules/leave-exit/services/leave-balance.service.js';
import { LeaveRequestService } from '@modules/leave-exit/services/leave-request.service.js';
import { ResignationService } from '@modules/leave-exit/services/resignation.service.js';
import { ExitManagementService } from '@modules/leave-exit/services/exit-management.service.js';
import { FullFinalPreparationService } from '@modules/leave-exit/services/full-final-preparation.service.js';
import { CompanyCalendarService } from '@modules/leave-exit/services/company-calendar.service.js';
import { LeaveExitSeederService } from '@modules/leave-exit/services/leave-exit-seeder.service.js';
import {
  applyLeaveSchema,
  balanceAdjustSchema,
  calendarQuerySchema,
  completeChecklistSchema,
  createPolicySchema,
  idParamSchema,
  listQuerySchema,
  submitResignationSchema,
} from '@modules/leave-exit/validators/leave-exit.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildLeaveExitActor(req);
}

export const seedLeaveExitDefaults: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await LeaveExitSeederService.seedDefaults(actor(authReq));
    return ResponseService.success(res, authReq, { seeded: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listPolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await LeavePolicyService.list(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createPolicy: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createPolicySchema, req.body);
    const data = await LeavePolicyService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getBalances: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : authReq.user.employeeId;
    if (!employeeId) {
      return ResponseService.success(res, authReq, []);
    }
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await LeaveBalanceService.getForEmployee(authReq.user.companyId, employeeId, year);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const adjustBalance: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(balanceAdjustSchema, req.body);
    const data = await LeaveBalanceService.adjust(actor(authReq), payload.employeeId, payload.leavePolicyId, payload.amount, payload.notes);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listLeaveRequests: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await LeaveRequestService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const applyLeave: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(applyLeaveSchema, req.body);
    const data = await LeaveRequestService.apply(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const withdrawLeave: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await LeaveRequestService.withdraw(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getLeaveCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(calendarQuerySchema, req.query);
    const data = await LeaveRequestService.getCalendar(authReq.user.companyId, query.startDate, query.endDate, query.employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getCompanyCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(calendarQuerySchema, req.query);
    const data = await CompanyCalendarService.getEvents(authReq.user.companyId, query.startDate, query.endDate, query.employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listResignations: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : undefined;
    const data = await ResignationService.list(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitResignation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(submitResignationSchema, req.body);
    const data = await ResignationService.submit(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const withdrawResignation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ResignationService.withdraw(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getExitProcess: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ExitManagementService.getProcess(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const completeExitItem: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { notes } = validateInput(completeChecklistSchema, req.body);
    const data = await ExitManagementService.completeChecklistItem(actor(authReq), id, notes);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listExitTemplates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await ExitManagementService.listTemplates(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getFullFinalPrep: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : authReq.user.employeeId;
    if (!employeeId) {
      return ResponseService.success(res, authReq, null);
    }
    const data = await FullFinalPreparationService.getByEmployee(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
