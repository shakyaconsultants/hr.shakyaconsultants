import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { REPORTS_PERMISSIONS } from '@modules/reports/constants/reports-permissions.constants.js';
import {
  exportReport,
  generateReport,
  getDomainAnalytics,
  getExecutiveDashboard,
  getRoleDashboard,
  getSettings,
  getWidgetData,
  getWidgets,
  searchReports,
  updateSettings,
} from '@modules/reports/controllers/reports.controller.js';

const reportsRoutes = Router();

reportsRoutes.use(authenticateMiddleware);
reportsRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Reports] */
reportsRoutes.get(
  '/dashboard/executive',
  authorize(REPORTS_PERMISSIONS.DASHBOARD_READ),
  getExecutiveDashboard,
);
reportsRoutes.get(
  '/dashboard/:role',
  authorize(REPORTS_PERMISSIONS.DASHBOARD_READ),
  getRoleDashboard,
);

reportsRoutes.get('/widgets', authorize(REPORTS_PERMISSIONS.DASHBOARD_READ), getWidgets);
reportsRoutes.get(
  '/widgets/:id/data',
  authorize(REPORTS_PERMISSIONS.DASHBOARD_READ),
  getWidgetData,
);

reportsRoutes.get('/settings', authorize(REPORTS_PERMISSIONS.DASHBOARD_READ), getSettings);
reportsRoutes.patch('/settings', authorize(REPORTS_PERMISSIONS.SETTINGS_MANAGE), updateSettings);

reportsRoutes.get(
  '/analytics/:domain',
  authorize(REPORTS_PERMISSIONS.REPORT_READ),
  getDomainAnalytics,
);
reportsRoutes.get('/reports', authorize(REPORTS_PERMISSIONS.REPORT_READ), generateReport);
reportsRoutes.get('/reports/export', authorize(REPORTS_PERMISSIONS.REPORT_EXPORT), exportReport);
reportsRoutes.get('/search', authorize(REPORTS_PERMISSIONS.REPORT_READ), searchReports);

export { reportsRoutes };
