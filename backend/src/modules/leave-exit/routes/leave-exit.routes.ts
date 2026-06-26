import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { LEAVE_EXIT_PERMISSIONS } from '@modules/leave-exit/constants/leave-exit.constants.js';
import {
  adjustBalance,
  applyLeave,
  completeExitItem,
  createPolicy,
  getBalances,
  getCompanyCalendar,
  getExitProcess,
  getFullFinalPrep,
  getLeaveCalendar,
  listExitTemplates,
  listLeaveRequests,
  listPolicies,
  listResignations,
  seedLeaveExitDefaults,
  submitResignation,
  withdrawLeave,
  withdrawResignation,
} from '@modules/leave-exit/controllers/leave-exit.controller.js';

const leaveExitRoutes = Router();

leaveExitRoutes.use(authenticateMiddleware);
leaveExitRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Leave & Exit] */
leaveExitRoutes.post('/seed-defaults', authorize(LEAVE_EXIT_PERMISSIONS.POLICY_MANAGE), seedLeaveExitDefaults);

leaveExitRoutes.get('/policies', authorize(LEAVE_EXIT_PERMISSIONS.POLICY_READ), listPolicies);
leaveExitRoutes.post('/policies', authorize(LEAVE_EXIT_PERMISSIONS.POLICY_MANAGE), createPolicy);

leaveExitRoutes.get('/balances', authorize(LEAVE_EXIT_PERMISSIONS.BALANCE_READ), getBalances);
leaveExitRoutes.post('/balances/adjust', authorize(LEAVE_EXIT_PERMISSIONS.BALANCE_MANAGE), adjustBalance);

leaveExitRoutes.get('/leave-requests', authorize(LEAVE_EXIT_PERMISSIONS.LEAVE_READ), listLeaveRequests);
leaveExitRoutes.post('/leave-requests', authorize(LEAVE_EXIT_PERMISSIONS.LEAVE_CREATE), applyLeave);
leaveExitRoutes.post('/leave-requests/:id/withdraw', authorize(LEAVE_EXIT_PERMISSIONS.LEAVE_UPDATE), withdrawLeave);
leaveExitRoutes.get('/leave-requests/calendar', authorize(LEAVE_EXIT_PERMISSIONS.LEAVE_READ), getLeaveCalendar);

leaveExitRoutes.get('/calendar', authorize(LEAVE_EXIT_PERMISSIONS.CALENDAR_READ), getCompanyCalendar);

leaveExitRoutes.get('/resignations', authorize(LEAVE_EXIT_PERMISSIONS.RESIGNATION_READ), listResignations);
leaveExitRoutes.post('/resignations', authorize(LEAVE_EXIT_PERMISSIONS.RESIGNATION_CREATE), submitResignation);
leaveExitRoutes.post('/resignations/:id/withdraw', authorize(LEAVE_EXIT_PERMISSIONS.RESIGNATION_UPDATE), withdrawResignation);

leaveExitRoutes.get('/exit/templates', authorize(LEAVE_EXIT_PERMISSIONS.EXIT_READ), listExitTemplates);
leaveExitRoutes.get('/exit/processes/:id', authorize(LEAVE_EXIT_PERMISSIONS.EXIT_READ), getExitProcess);
leaveExitRoutes.post('/exit/checklist/:id/complete', authorize(LEAVE_EXIT_PERMISSIONS.EXIT_MANAGE), completeExitItem);

leaveExitRoutes.get('/full-final', authorize(LEAVE_EXIT_PERMISSIONS.EXIT_READ), getFullFinalPrep);

export { leaveExitRoutes };
