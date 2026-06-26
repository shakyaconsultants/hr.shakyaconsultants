import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { ATTENDANCE_PERMISSIONS } from '@modules/attendance/constants/attendance.constants.js';
import {
  createCorrection,
  createShiftAssignment,
  deleteShiftAssignment,
  exportReports,
  getEnterpriseDashboard,
  getExceptions,
  getHrDashboard,
  getManagerDashboard,
  getPolicies,
  getRecordsCalendar,
  getReports,
  getTeam,
  getTodayRecord,
  listCorrections,
  listRecords,
  listShiftAssignments,
  overrideRecord,
  processMonthly,
  punch,
  submitCorrection,
  updatePolicies,
  updateShiftAssignment,
} from '@modules/attendance/controllers/attendance.controller.js';

const attendanceRoutes = Router();

attendanceRoutes.use(authenticateMiddleware);
attendanceRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Attendance] */
attendanceRoutes.get('/dashboard/enterprise', authorize(ATTENDANCE_PERMISSIONS.READ), getEnterpriseDashboard);
attendanceRoutes.get('/dashboard/hr', authorize(ATTENDANCE_PERMISSIONS.READ), getHrDashboard);
attendanceRoutes.get('/dashboard/manager', authorize(ATTENDANCE_PERMISSIONS.READ), getManagerDashboard);

attendanceRoutes.get('/policies', authorize(ATTENDANCE_PERMISSIONS.READ), getPolicies);
attendanceRoutes.patch('/policies', authorize(ATTENDANCE_PERMISSIONS.UPDATE), updatePolicies);

attendanceRoutes.get('/shift-assignments', authorize(ATTENDANCE_PERMISSIONS.SHIFT_READ), listShiftAssignments);
attendanceRoutes.post('/shift-assignments', authorize(ATTENDANCE_PERMISSIONS.SHIFT_CREATE), createShiftAssignment);
attendanceRoutes.patch('/shift-assignments/:id', authorize(ATTENDANCE_PERMISSIONS.SHIFT_UPDATE), updateShiftAssignment);
attendanceRoutes.delete('/shift-assignments/:id', authorize(ATTENDANCE_PERMISSIONS.SHIFT_DELETE), deleteShiftAssignment);

attendanceRoutes.post('/punch', authorize(ATTENDANCE_PERMISSIONS.CREATE), punch);

attendanceRoutes.get('/records', authorize(ATTENDANCE_PERMISSIONS.READ), listRecords);
attendanceRoutes.get('/records/today', authorize(ATTENDANCE_PERMISSIONS.READ), getTodayRecord);
attendanceRoutes.get('/records/calendar', authorize(ATTENDANCE_PERMISSIONS.READ), getRecordsCalendar);

attendanceRoutes.post('/corrections', authorize(ATTENDANCE_PERMISSIONS.CREATE), createCorrection);
attendanceRoutes.get('/corrections', authorize(ATTENDANCE_PERMISSIONS.READ), listCorrections);
attendanceRoutes.post('/corrections/:id/submit', authorize(ATTENDANCE_PERMISSIONS.CREATE), submitCorrection);

attendanceRoutes.get('/reports', authorize(ATTENDANCE_PERMISSIONS.READ), getReports);
attendanceRoutes.get('/reports/export', authorize(ATTENDANCE_PERMISSIONS.READ), exportReports);

attendanceRoutes.post('/processing/monthly', authorize(ATTENDANCE_PERMISSIONS.UPDATE), processMonthly);

attendanceRoutes.post('/overrides', authorize(ATTENDANCE_PERMISSIONS.UPDATE), overrideRecord);

attendanceRoutes.get('/team', authorize(ATTENDANCE_PERMISSIONS.READ), getTeam);
attendanceRoutes.get('/exceptions', authorize(ATTENDANCE_PERMISSIONS.READ), getExceptions);

export { attendanceRoutes };
