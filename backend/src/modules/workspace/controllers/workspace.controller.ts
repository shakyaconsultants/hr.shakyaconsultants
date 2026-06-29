import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { WorkspaceWidgetService } from '@modules/workspace/services/workspace-widget.service.js';
import { WorkspaceWidgetDataService } from '@modules/workspace/services/workspace-widget-data.service.js';
import { WorkspaceProfileService } from '@modules/workspace/services/workspace-profile.service.js';
import { WorkspaceHierarchyService } from '@modules/workspace/services/workspace-hierarchy.service.js';
import { WorkspaceMyProjectsService } from '@modules/workspace/services/workspace-my-projects.service.js';
import { WorkspaceMyTasksService } from '@modules/workspace/services/workspace-my-tasks.service.js';
import { WorkspaceDocumentsService } from '@modules/workspace/services/workspace-documents.service.js';
import { WorkspaceAnnouncementsService } from '@modules/workspace/services/workspace-announcements.service.js';
import { WorkspaceNotificationsService } from '@modules/workspace/services/workspace-notifications.service.js';
import { WorkspaceTimelineService } from '@modules/workspace/services/workspace-timeline.service.js';
import { WorkspaceCalendarService } from '@modules/workspace/services/workspace-calendar.service.js';
import { WorkspaceSearchService } from '@modules/workspace/services/workspace-search.service.js';
import { buildWorkspaceActor } from '@modules/workspace/types/workspace.types.js';
import {
  bulkTaskStatusSchema,
  calendarQuerySchema,
  idParamSchema,
  listQuerySchema,
  myTasksQuerySchema,
  notificationQuerySchema,
  profileUpdateSchema,
  quickTaskUpdateSchema,
  searchQuerySchema,
  slugParamSchema,
  widgetConfigSchema,
} from '@modules/workspace/validators/workspace.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildWorkspaceActor(req);
}

async function permissions(req: AuthenticatedRequest): Promise<string[]> {
  if (req.auth?.permissions) {
    return req.auth.permissions;
  }
  if (!req.user.employeeId) {
    return [];
  }
  const perms = await PermissionEngineService.getPermissionsForUser(req.user.companyId, req.user.employeeId);
  req.auth = { permissions: perms };
  return perms;
}

export const getWorkspaceLayout: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const context = actor(authReq);
    const perms = await permissions(authReq);
    const data = await WorkspaceWidgetService.getLayout(context.companyId, context.employeeId, perms);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateWidgetConfig: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const context = actor(authReq);
    const payload = validateInput(widgetConfigSchema, req.body);
    const widgets = await WorkspaceWidgetService.updateConfig(context, payload.widgets);
    return ResponseService.success(res, authReq, { widgets });
  } catch (error) {
    next(error);
    return;
  }
};

export const getWidgetData: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const context = actor(authReq);
    const { slug } = validateInput(slugParamSchema, req.params);
    const data = await WorkspaceWidgetDataService.load(context, slug);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await WorkspaceProfileService.getProfile(actor(authReq));
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(profileUpdateSchema, req.body);
    const data = await WorkspaceProfileService.updateProfile(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getHierarchy: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await WorkspaceHierarchyService.getOrgChart(actor(authReq));
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listMyProjects: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await WorkspaceMyProjectsService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, {
      items: data.items,
      pagination: {
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
        total: data.total,
        totalPages: Math.max(1, Math.ceil(data.total / (data.pageSize ?? 20))),
      },
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const getMyProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceMyProjectsService.getById(actor(authReq), id);
    if (!data) {
      throw new NotFoundError('Project not found or not assigned', ERROR_CODES.NOT_FOUND);
    }
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listMyTasks: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(myTasksQuerySchema, req.query);
    const data = await WorkspaceMyTasksService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getMyTasksKanban: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const data = await WorkspaceMyTasksService.getKanban(actor(authReq), projectId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getMyTasksCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startDate, endDate } = validateInput(calendarQuerySchema, req.query);
    const data = await WorkspaceMyTasksService.getCalendar(actor(authReq), startDate, endDate);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkUpdateMyTasks: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(bulkTaskStatusSchema, req.body);
    const data = await WorkspaceMyTasksService.bulkUpdateStatus(actor(authReq), payload.taskIds, payload.status);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const quickUpdateMyTask: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(quickTaskUpdateSchema, req.body);
    const data = await WorkspaceMyTasksService.quickUpdate(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listDocuments: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await WorkspaceDocumentsService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, {
      items: data.items,
      pagination: {
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
        total: data.total,
        totalPages: Math.max(1, Math.ceil(data.total / (data.pageSize ?? 20))),
      },
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const getDocument: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceDocumentsService.getById(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const downloadDocument: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceDocumentsService.recordDownload(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listAnnouncements: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await WorkspaceAnnouncementsService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, {
      items: data.items,
      pagination: {
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
        total: data.total,
        totalPages: Math.max(1, Math.ceil(data.total / (data.pageSize ?? 20))),
      },
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const getAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceAnnouncementsService.getById(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const acknowledgeAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceAnnouncementsService.acknowledge(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listNotifications: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(notificationQuerySchema, req.query);
    const data = await WorkspaceNotificationsService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, {
      items: data.items,
      pagination: data.pagination,
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const markNotificationRead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceNotificationsService.markRead(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const markAllNotificationsRead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await WorkspaceNotificationsService.markAllRead(actor(authReq));
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const archiveNotification: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WorkspaceNotificationsService.archive(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listActivity: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await WorkspaceTimelineService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, {
      items: data.items,
      pagination: {
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
        total: data.total,
        totalPages: Math.max(1, Math.ceil(data.total / (data.pageSize ?? 20))),
      },
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const getCalendar: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startDate, endDate } = validateInput(calendarQuerySchema, req.query);
    const data = await WorkspaceCalendarService.getEvents(actor(authReq), startDate, endDate);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const search: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(searchQuerySchema, req.query);
    const types = query.types ? query.types.split(',').map((t) => t.trim()) : undefined;
    const data = await WorkspaceSearchService.search(actor(authReq), { q: query.q, types, limit: query.limit });
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
