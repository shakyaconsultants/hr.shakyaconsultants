import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { buildPayrollActor } from '@modules/approval/types/approval.types.js';
import { PayrollPolicyService } from '@modules/payroll/services/payroll-policy.service.js';
import { PayrollComponentService } from '@modules/payroll/services/payroll-component.service.js';
import { SalaryStructureService } from '@modules/payroll/services/salary-structure.service.js';
import { EmployeeCompensationService } from '@modules/payroll/services/employee-compensation.service.js';
import { PayrollProcessingService } from '@modules/payroll/services/payroll-processing.service.js';
import { PayrollLockService } from '@modules/payroll/services/payroll-lock.service.js';
import { SalaryRevisionService } from '@modules/payroll/services/salary-revision.service.js';
import { PayslipService } from '@modules/payroll/services/payslip.service.js';
import { PayrollReportService } from '@modules/payroll/services/payroll-report.service.js';
import { PayrollDashboardService } from '@modules/payroll/services/payroll-dashboard.service.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import {
  assignCompensationSchema,
  createComponentSchema,
  createPayrollRunSchema,
  createSalaryRevisionSchema,
  createSalaryStructureSchema,
  dashboardQuerySchema,
  employeeIdParamSchema,
  exceptionsQuerySchema,
  idParamSchema,
  listCompensationsQuerySchema,
  listComponentsQuerySchema,
  listPayrollRunsQuerySchema,
  listPayslipsQuerySchema,
  listSalaryRevisionsQuerySchema,
  listSalaryStructuresQuerySchema,
  processPayrollRunSchema,
  reportQuerySchema,
  updateCompensationSchema,
  updateComponentSchema,
  updatePoliciesSchema,
  updateSalaryRevisionSchema,
  updateSalaryStructureSchema,
  uploadPayslipSchema,
} from '@modules/payroll/validators/payroll.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildPayrollActor(req);
}

function parseDashboardQuery(req: AuthenticatedRequest) {
  return validateInput(dashboardQuerySchema, req.query);
}

export const getEnterpriseDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = parseDashboardQuery(authReq);
    const data = await PayrollDashboardService.getEnterpriseDashboard(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getFinanceDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = parseDashboardQuery(authReq);
    const data = await PayrollDashboardService.getFinanceDashboard(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getHrDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = parseDashboardQuery(authReq);
    const data = await PayrollDashboardService.getHrDashboard(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await PayrollPolicyService.getPolicies(authReq.user.companyId);
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
    const data = await PayrollPolicyService.updatePolicies(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettings: RequestHandler = getPolicies;
export const updateSettings: RequestHandler = updatePolicies;

export const listSalaryStructures: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listSalaryStructuresQuerySchema, req.query);
    const data = await SalaryStructureService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSalaryStructure: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createSalaryStructureSchema, req.body);
    const data = await SalaryStructureService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSalaryStructure: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await SalaryStructureService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSalaryStructure: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateSalaryStructureSchema, req.body);
    const data = await SalaryStructureService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteSalaryStructure: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await SalaryStructureService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listComponents: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listComponentsQuerySchema, req.query);
    const data = await PayrollComponentService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createComponent: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createComponentSchema, req.body);
    const data = await PayrollComponentService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getComponent: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const data = await PayrollComponentService.getById(authReq.user.companyId, id, kind);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateComponent: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateComponentSchema, req.body);
    const data = await PayrollComponentService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteComponent: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    await PayrollComponentService.delete(actor(authReq), id, kind);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const listEmployeeCompensations: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listCompensationsQuerySchema, req.query);
    const data = await EmployeeCompensationService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getMyCompensation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user.employeeId) {
      return ResponseService.success(res, authReq, null);
    }
    const data = await EmployeeCompensationService.getMyCompensation(
      authReq.user.companyId,
      authReq.user.employeeId,
    );
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignEmployeeCompensation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(assignCompensationSchema, req.body);
    const data = await EmployeeCompensationService.assign(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEmployeeCompensation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await EmployeeCompensationService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateEmployeeCompensation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateCompensationSchema, req.body);
    const data = await EmployeeCompensationService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEmployeeSalaryHistory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const data = await EmployeeCompensationService.getSalaryHistory(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listPayrollRuns: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listPayrollRunsQuerySchema, req.query);
    const data = await PayrollProcessingService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createPayrollRun: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createPayrollRunSchema, req.body);
    const data = await PayrollProcessingService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPayrollRun: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayrollProcessingService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const processPayrollRun: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(processPayrollRunSchema, req.body ?? {});
    const data = await PayrollProcessingService.process(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitPayrollRun: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayrollProcessingService.submit(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const lockPayrollRun: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayrollLockService.lock(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const unlockPayrollRun: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayrollLockService.unlock(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listPayrollPayslips: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayslipService.listForPayroll(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const generatePayrollPayslips: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayslipService.generateForPayroll(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listPayslips: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listPayslipsQuerySchema, req.query);
    const permissions = authReq.auth?.permissions ?? [];
    const canViewAllPayroll = permissions.includes('payroll.read') || permissions.includes('payroll.update');
    const scopedQuery = {
      ...query,
      employeeId:
        !canViewAllPayroll && authReq.user.employeeId && !query.employeeId
          ? authReq.user.employeeId
          : query.employeeId,
    };
    const data = await PayslipService.list(authReq.user.companyId, scopedQuery);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listMyPayslips: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user.employeeId) {
      return ResponseService.success(res, authReq, { items: [], total: 0, page: 1, pageSize: 20 });
    }
    const query = validateInput(listPayslipsQuerySchema, req.query);
    const data = await PayslipService.list(authReq.user.companyId, {
      ...query,
      employeeId: authReq.user.employeeId,
    });
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPayslip: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await PayslipService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const downloadPayslip: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payslip = await PayslipService.getById(authReq.user.companyId, id);
    if (payslip.pdfUrl) {
      return res.redirect(payslip.pdfUrl);
    }
    const html = await PayslipService.getDownloadHtml(authReq.user.companyId, id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="payslip-${id}.html"`);
    return res.send(html);
  } catch (error) {
    next(error);
    return;
  }
};

export const uploadPayslip: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const body = req.body as Record<string, string | undefined>;
    const meta = validateInput(uploadPayslipSchema, {
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      grossSalary: body.grossSalary,
      netSalary: body.netSalary,
      currency: body.currency,
    });
    const file = req.file;
    if (!file) {
      throw new ValidationError('No file uploaded', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    const data = await PayslipService.uploadManual(actor(authReq), employeeId, {
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      periodStart: meta.periodStart,
      periodEnd: meta.periodEnd,
      grossSalary: meta.grossSalary,
      netSalary: meta.netSalary,
      currency: meta.currency,
    });
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listSalaryRevisions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listSalaryRevisionsQuerySchema, req.query);
    const data = await SalaryRevisionService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSalaryRevision: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createSalaryRevisionSchema, req.body);
    const data = await SalaryRevisionService.create(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSalaryRevision: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await SalaryRevisionService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSalaryRevision: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateSalaryRevisionSchema, req.body);
    const data = await SalaryRevisionService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitSalaryRevision: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await SalaryRevisionService.submit(actor(authReq), id);
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
    const data = await PayrollReportService.generate(authReq.user.companyId, query);
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
    const csv = await PayrollReportService.exportCsv(authReq.user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll-report.csv"');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const getExceptions: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(exceptionsQuerySchema, req.query);
    const data = await PayrollDashboardService.getExceptions(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
