import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { uploadMiddleware } from '@config/upload.config.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import {
  PAYROLL_PERMISSIONS,
  PAYSLIP_PERMISSIONS,
} from '@modules/payroll/constants/payroll-permissions.constants.js';
import {
  assignEmployeeCompensation,
  createComponent,
  createPayrollRun,
  createSalaryRevision,
  createSalaryStructure,
  deleteComponent,
  deleteSalaryStructure,
  downloadPayslip,
  exportReports,
  generatePayrollPayslips,
  getComponent,
  getEmployeeCompensation,
  getEmployeeSalaryHistory,
  getActiveEmployeeCompensation,
  getMyCompensation,
  getEnterpriseDashboard,
  getExceptions,
  getFinanceDashboard,
  getHrDashboard,
  getPayrollRun,
  getPayslip,
  getPolicies,
  getReports,
  getSalaryRevision,
  getSalaryStructure,
  getSettings,
  listComponents,
  listEmployeeCompensations,
  listPayrollPayslips,
  listPayrollRuns,
  listPayslips,
  listMyPayslips,
  listSalaryRevisions,
  listSalaryStructures,
  lockPayrollRun,
  processPayrollRun,
  submitPayrollRun,
  submitSalaryRevision,
  unlockPayrollRun,
  updateComponent,
  updateEmployeeCompensation,
  updatePolicies,
  updateSalaryRevision,
  updateSalaryStructure,
  updateSettings,
  uploadPayslip,
} from '@modules/payroll/controllers/payroll.controller.js';

const payrollRoutes = Router();

payrollRoutes.use(authenticateMiddleware);
payrollRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Payroll] */
payrollRoutes.get(
  '/dashboard/enterprise',
  authorize(PAYROLL_PERMISSIONS.READ),
  getEnterpriseDashboard,
);
payrollRoutes.get('/dashboard/finance', authorize(PAYROLL_PERMISSIONS.READ), getFinanceDashboard);
payrollRoutes.get('/dashboard/hr', authorize(PAYROLL_PERMISSIONS.READ), getHrDashboard);

payrollRoutes.get('/policies', authorize(PAYROLL_PERMISSIONS.READ), getPolicies);
payrollRoutes.patch('/policies', authorize(PAYROLL_PERMISSIONS.UPDATE), updatePolicies);
payrollRoutes.get('/settings', authorize(PAYROLL_PERMISSIONS.READ), getSettings);
payrollRoutes.patch('/settings', authorize(PAYROLL_PERMISSIONS.UPDATE), updateSettings);

payrollRoutes.get('/salary-structures', authorize(PAYROLL_PERMISSIONS.READ), listSalaryStructures);
payrollRoutes.post(
  '/salary-structures',
  authorize(PAYROLL_PERMISSIONS.CREATE),
  createSalaryStructure,
);
payrollRoutes.get(
  '/salary-structures/:id',
  authorize(PAYROLL_PERMISSIONS.READ),
  getSalaryStructure,
);
payrollRoutes.patch(
  '/salary-structures/:id',
  authorize(PAYROLL_PERMISSIONS.UPDATE),
  updateSalaryStructure,
);
payrollRoutes.delete(
  '/salary-structures/:id',
  authorize(PAYROLL_PERMISSIONS.DELETE),
  deleteSalaryStructure,
);

payrollRoutes.get('/components', authorize(PAYROLL_PERMISSIONS.READ), listComponents);
payrollRoutes.post('/components', authorize(PAYROLL_PERMISSIONS.CREATE), createComponent);
payrollRoutes.get('/components/:id', authorize(PAYROLL_PERMISSIONS.READ), getComponent);
payrollRoutes.patch('/components/:id', authorize(PAYROLL_PERMISSIONS.UPDATE), updateComponent);
payrollRoutes.delete('/components/:id', authorize(PAYROLL_PERMISSIONS.DELETE), deleteComponent);

payrollRoutes.get(
  '/employee-compensations',
  authorize(PAYROLL_PERMISSIONS.READ),
  listEmployeeCompensations,
);
payrollRoutes.get(
  '/employees/:employeeId/compensation',
  authorize(PAYROLL_PERMISSIONS.READ),
  getActiveEmployeeCompensation,
);
payrollRoutes.get('/me/compensation', authorize(PAYSLIP_PERMISSIONS.READ), getMyCompensation);
payrollRoutes.post(
  '/employee-compensations',
  authorize(PAYROLL_PERMISSIONS.CREATE),
  assignEmployeeCompensation,
);
payrollRoutes.get(
  '/employee-compensations/:id',
  authorize(PAYROLL_PERMISSIONS.READ),
  getEmployeeCompensation,
);
payrollRoutes.patch(
  '/employee-compensations/:id',
  authorize(PAYROLL_PERMISSIONS.UPDATE),
  updateEmployeeCompensation,
);

payrollRoutes.get('/payroll-runs', authorize(PAYROLL_PERMISSIONS.READ), listPayrollRuns);
payrollRoutes.post('/payroll-runs', authorize(PAYROLL_PERMISSIONS.CREATE), createPayrollRun);
payrollRoutes.get('/payroll-runs/:id', authorize(PAYROLL_PERMISSIONS.READ), getPayrollRun);
payrollRoutes.post(
  '/payroll-runs/:id/process',
  authorize(PAYROLL_PERMISSIONS.PROCESS),
  processPayrollRun,
);
payrollRoutes.post(
  '/payroll-runs/:id/submit',
  authorize(PAYROLL_PERMISSIONS.UPDATE),
  submitPayrollRun,
);
payrollRoutes.post('/payroll-runs/:id/lock', authorize(PAYROLL_PERMISSIONS.UPDATE), lockPayrollRun);
payrollRoutes.post(
  '/payroll-runs/:id/unlock',
  authorize(PAYROLL_PERMISSIONS.UPDATE),
  unlockPayrollRun,
);
payrollRoutes.get(
  '/payroll-runs/:id/payslips',
  authorize(PAYSLIP_PERMISSIONS.READ),
  listPayrollPayslips,
);
payrollRoutes.post(
  '/payroll-runs/:id/generate-payslips',
  authorize(PAYSLIP_PERMISSIONS.CREATE),
  generatePayrollPayslips,
);

payrollRoutes.get('/payslips', authorize(PAYSLIP_PERMISSIONS.READ), listPayslips);
payrollRoutes.get('/me/payslips', authorize(PAYSLIP_PERMISSIONS.READ), listMyPayslips);
payrollRoutes.get('/payslips/:id', authorize(PAYSLIP_PERMISSIONS.READ), getPayslip);
payrollRoutes.get('/payslips/:id/download', authorize(PAYSLIP_PERMISSIONS.READ), downloadPayslip);
payrollRoutes.post(
  '/employees/:employeeId/payslips/upload',
  authorize(PAYSLIP_PERMISSIONS.CREATE),
  uploadMiddleware.single('file'),
  uploadPayslip,
);

payrollRoutes.get('/salary-revisions', authorize(PAYROLL_PERMISSIONS.READ), listSalaryRevisions);
payrollRoutes.post(
  '/salary-revisions',
  authorize(PAYROLL_PERMISSIONS.CREATE),
  createSalaryRevision,
);
payrollRoutes.get('/salary-revisions/:id', authorize(PAYROLL_PERMISSIONS.READ), getSalaryRevision);
payrollRoutes.patch(
  '/salary-revisions/:id',
  authorize(PAYROLL_PERMISSIONS.UPDATE),
  updateSalaryRevision,
);
payrollRoutes.post(
  '/salary-revisions/:id/submit',
  authorize(PAYROLL_PERMISSIONS.UPDATE),
  submitSalaryRevision,
);

payrollRoutes.get('/reports', authorize(PAYROLL_PERMISSIONS.READ), getReports);
payrollRoutes.get('/reports/export', authorize(PAYROLL_PERMISSIONS.READ), exportReports);

payrollRoutes.get('/exceptions', authorize(PAYROLL_PERMISSIONS.READ), getExceptions);
payrollRoutes.get(
  '/employees/:employeeId/salary-history',
  authorize(PAYROLL_PERMISSIONS.READ),
  getEmployeeSalaryHistory,
);

export { payrollRoutes };
