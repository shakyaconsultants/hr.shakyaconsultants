import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { requireEmployeeContext } from '@modules/workspace/middleware/require-employee.middleware.js';
import { WORKSPACE_PERMISSIONS } from '@modules/workspace/constants/workspace-permissions.constants.js';
import {
  acknowledgeAnnouncement,
  archiveNotification,
  bulkUpdateMyTasks,
  downloadDocument,
  getAnnouncement,
  getCalendar,
  getDocument,
  getHierarchy,
  getMyProject,
  getMyTasksCalendar,
  getMyTasksKanban,
  getProfile,
  getWidgetData,
  getWorkspaceLayout,
  listAnnouncements,
  listDocuments,
  listMyProjects,
  listMyTasks,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  quickUpdateMyTask,
  submitMyTaskForVerification,
  search,
  updateProfile,
  updateWidgetConfig,
  getOnboardingStatus,
  requestOnboardingPortalLink,
} from '@modules/workspace/controllers/workspace.controller.js';

const workspaceRoutes = Router();

workspaceRoutes.use(authenticateMiddleware);
workspaceRoutes.use(companyScopeMiddleware());
workspaceRoutes.use(requireEmployeeContext());

/** @swagger tags: [Workspace] */
workspaceRoutes.get('/', authorize(WORKSPACE_PERMISSIONS.READ), getWorkspaceLayout);
workspaceRoutes.get('/widgets/:slug', authorize(WORKSPACE_PERMISSIONS.WIDGETS_READ), getWidgetData);
workspaceRoutes.put('/widgets/config', authorize(WORKSPACE_PERMISSIONS.WIDGETS_MANAGE), updateWidgetConfig);

workspaceRoutes.get('/profile', authorize(WORKSPACE_PERMISSIONS.PROFILE_READ), getProfile);
workspaceRoutes.patch('/profile', authorize(WORKSPACE_PERMISSIONS.PROFILE_UPDATE), updateProfile);
workspaceRoutes.get('/hierarchy', authorize(WORKSPACE_PERMISSIONS.READ), getHierarchy);

workspaceRoutes.get('/projects', authorize(WORKSPACE_PERMISSIONS.READ), listMyProjects);
workspaceRoutes.get('/projects/:id', authorize(WORKSPACE_PERMISSIONS.READ), getMyProject);

workspaceRoutes.get('/tasks', authorize(WORKSPACE_PERMISSIONS.READ), listMyTasks);
workspaceRoutes.get('/tasks/kanban', authorize(WORKSPACE_PERMISSIONS.READ), getMyTasksKanban);
workspaceRoutes.get('/tasks/calendar', authorize(WORKSPACE_PERMISSIONS.READ), getMyTasksCalendar);
workspaceRoutes.post('/tasks/bulk-status', authorize(WORKSPACE_PERMISSIONS.READ), bulkUpdateMyTasks);
workspaceRoutes.patch('/tasks/:id', authorize(WORKSPACE_PERMISSIONS.READ), quickUpdateMyTask);
workspaceRoutes.post('/tasks/:id/submit-verification', authorize(WORKSPACE_PERMISSIONS.READ), submitMyTaskForVerification);

workspaceRoutes.get('/documents', authorize(WORKSPACE_PERMISSIONS.DOCUMENT_READ), listDocuments);
workspaceRoutes.get('/documents/:id', authorize(WORKSPACE_PERMISSIONS.DOCUMENT_READ), getDocument);
workspaceRoutes.post('/documents/:id/download', authorize(WORKSPACE_PERMISSIONS.DOCUMENT_READ), downloadDocument);

workspaceRoutes.get('/announcements', authorize(WORKSPACE_PERMISSIONS.ANNOUNCEMENT_READ), listAnnouncements);
workspaceRoutes.get('/announcements/:id', authorize(WORKSPACE_PERMISSIONS.ANNOUNCEMENT_READ), getAnnouncement);
workspaceRoutes.post('/announcements/:id/acknowledge', authorize(WORKSPACE_PERMISSIONS.ANNOUNCEMENT_ACKNOWLEDGE), acknowledgeAnnouncement);

workspaceRoutes.get('/notifications', authorize(WORKSPACE_PERMISSIONS.NOTIFICATION_READ), listNotifications);
workspaceRoutes.patch('/notifications/:id/read', authorize(WORKSPACE_PERMISSIONS.NOTIFICATION_MANAGE), markNotificationRead);
workspaceRoutes.post('/notifications/mark-all-read', authorize(WORKSPACE_PERMISSIONS.NOTIFICATION_MANAGE), markAllNotificationsRead);
workspaceRoutes.patch('/notifications/:id/archive', authorize(WORKSPACE_PERMISSIONS.NOTIFICATION_MANAGE), archiveNotification);

workspaceRoutes.get('/calendar', authorize(WORKSPACE_PERMISSIONS.CALENDAR_READ), getCalendar);
workspaceRoutes.get('/search', authorize(WORKSPACE_PERMISSIONS.SEARCH), search);

workspaceRoutes.get('/onboarding/status', authorize(WORKSPACE_PERMISSIONS.READ), getOnboardingStatus);
workspaceRoutes.post('/onboarding/portal-link', authorize(WORKSPACE_PERMISSIONS.READ), requestOnboardingPortalLink);

export { workspaceRoutes };
