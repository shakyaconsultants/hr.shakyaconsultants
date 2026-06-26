import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { buildAttendanceActor } from '@modules/approval/types/approval.types.js';
import { AttendancePolicyService } from '@modules/attendance/services/attendance-policy.service.js';
import { PunchService } from '@modules/attendance/services/punch.service.js';
import { AttendanceRecordService } from '@modules/attendance/services/attendance-record.service.js';
import { AttendanceCorrectionService } from '@modules/attendance/services/correction.service.js';
import { ShiftAssignmentService } from '@modules/attendance/services/shift-assignment.service.js';
import { AttendanceReportService } from '@modules/attendance/services/report.service.js';
import { AttendanceMonthlyProcessingService } from '@modules/attendance/services/monthly-processing.service.js';
import { AttendanceDashboardService } from '@modules/attendance/services/attendance-dashboard.service.js';
import {
  calendarQuerySchema,
  createCorrectionSchema,
  createShiftAssignmentSchema,
  exceptionsQuerySchema,
  idParamSchema,
  listCorrectionsQuerySchema,
  listRecordsQuerySchema,
  monthlyProcessingSchema,
  overrideRecordSchema,
  punchSchema,
  reportQuerySchema,
  teamQuerySchema,
  updatePoliciesSchema,
  updateShiftAssignmentSchema,
} from '@modules/attendance/validators/attendance.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildAttendanceActor(req);
}

export const getEnterpriseDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const data = await AttendanceDashboardService.getEnterpriseDashboard(authReq.user.companyId, date);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getHrDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const data = await AttendanceDashboardService.getHrDashboard(authReq.user.companyId, date);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getManagerDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const managerId = authReq.user.employeeId;
    if (!managerId) {
      return ResponseService.success(res, authReq, { teamSize: 0, members: [] });
    }
    const data = await AttendanceDashboardService.getManagerDashboard(authReq.user.companyId, managerId, date);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await AttendancePolicyService.getPolicies(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updatePolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(updatePoliciesSchema, req.body);
    const data = await AttendancePolicyService.updatePolicies(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listShiftAssignments: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : undefined;
    const workShiftId = typeof req.query.workShiftId === 'string' ? req.query.workShiftId : undefined;
    const data = await ShiftAssignmentService.list(authReq.user.companyId, { employeeId, workShiftId });
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createShiftAssignment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createShiftAssignmentSchema, req.body);
    const data = await ShiftAssignmentService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateShiftAssignment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateShiftAssignmentSchema, req.body);
    const data = await ShiftAssignmentService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteShiftAssignment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ShiftAssignmentService.remove(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const punch: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(punchSchema, req.body);
    const data = await PunchService.punch(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listRecords: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listRecordsQuerySchema, req.query);
    const data = await AttendanceRecordService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getTodayRecord: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : authReq.user.employeeId;
    if (!employeeId) {
      return ResponseService.success(res, authReq, null);
    }
    const data = await AttendanceRecordService.getToday(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getRecordsCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(calendarQuerySchema, req.query);
    const data = await AttendanceRecordService.getCalendar(
      authReq.user.companyId,
      query.startDate,
      query.endDate,
      query.employeeId,
    );
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createCorrection: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createCorrectionSchema, req.body);
    const data = await AttendanceCorrectionService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listCorrections: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listCorrectionsQuerySchema, req.query);
    const data = await AttendanceCorrectionService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitCorrection: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await AttendanceCorrectionService.submit(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getReports: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(reportQuerySchema, req.query);
    const data = await AttendanceReportService.generate(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportReports: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(reportQuerySchema, req.query);
    const csv = await AttendanceReportService.exportCsv(authReq.user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const processMonthly: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(monthlyProcessingSchema, req.body);
    const data = await AttendanceMonthlyProcessingService.processMonth(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const overrideRecord: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(overrideRecordSchema, req.body);
    const data = await AttendanceRecordService.override(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getTeam: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(teamQuerySchema, req.query);
    const managerId = authReq.user.employeeId;
    if (!managerId) {
      return ResponseService.success(res, authReq, []);
    }
    const data = await AttendanceRecordService.getTeamRecords(authReq.user.companyId, managerId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getExceptions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(exceptionsQuerySchema, req.query);
    const data = await AttendanceRecordService.getExceptions(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
