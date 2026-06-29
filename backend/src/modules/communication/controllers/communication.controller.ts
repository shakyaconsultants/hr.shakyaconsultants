import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import { buildCommunicationActor } from '@modules/approval/types/approval.types.js';
import { CommunicationPolicyService } from '@modules/communication/services/communication-policy.service.js';
import { AnnouncementService } from '@modules/communication/services/announcement.service.js';
import { ChannelService } from '@modules/communication/services/channel.service.js';
import { DirectMessageService } from '@modules/communication/services/direct-message.service.js';
import { MessageService } from '@modules/communication/services/message.service.js';
import { NotificationCenterService } from '@modules/communication/services/notification-center.service.js';
import { InboxService } from '@modules/communication/services/inbox.service.js';
import { CommunicationSearchService } from '@modules/communication/services/search.service.js';
import { CommunicationReportService } from '@modules/communication/services/communication-report.service.js';
import { CommunicationDashboardService } from '@modules/communication/services/communication-dashboard.service.js';
import {
  announcementListQuerySchema,
  channelListQuerySchema,
  createAnnouncementSchema,
  createChannelSchema,
  dashboardQuerySchema,
  directConversationSchema,
  forwardMessageSchema,
  idParamSchema,
  listQuerySchema,
  notificationListQuerySchema,
  reportQuerySchema,
  searchQuerySchema,
  sendMessageSchema,
  updateAnnouncementSchema,
  updateChannelSchema,
  updateMessageSchema,
  updatePoliciesSchema,
  updateSettingsSchema,
} from '@modules/communication/validators/communication.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildCommunicationActor(req);
}

async function permissions(req: AuthenticatedRequest): Promise<string[]> {
  if (req.auth?.permissions) return req.auth.permissions;
  if (!req.user.employeeId) return [];
  const perms = await PermissionEngineService.getPermissionsForUser(req.user.companyId, req.user.employeeId);
  req.auth = { permissions: perms };
  return perms;
}

export const getEnterpriseDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await CommunicationDashboardService.getEnterpriseDashboard(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getManagerDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await CommunicationDashboardService.getManagerDashboard(actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getWorkspaceDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(dashboardQuerySchema, req.query);
    const data = await CommunicationDashboardService.getWorkspaceDashboard(actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPolicies: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await CommunicationPolicyService.getPolicies(authReq.user.companyId);
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
    const data = await CommunicationPolicyService.updatePolicies(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettings: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await CommunicationPolicyService.getSettings(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(updateSettingsSchema, req.body);
    const data = await CommunicationPolicyService.updateSettings(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listAnnouncements: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(announcementListQuerySchema, req.query);
    const perms = await permissions(authReq);
    const data = await AnnouncementService.listAdmin(actor(authReq), perms, query);
    return ResponseService.paginated(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createAnnouncementSchema, req.body);
    const perms = await permissions(authReq);
    const data = await AnnouncementService.create(actor(authReq), perms, payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await AnnouncementService.getAdminById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateAnnouncementSchema, req.body);
    const perms = await permissions(authReq);
    const data = await AnnouncementService.update(actor(authReq), perms, id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    const data = await AnnouncementService.delete(actor(authReq), perms, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const publishAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    const data = await AnnouncementService.publish(actor(authReq), perms, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getAnnouncementStats: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await AnnouncementService.getStats(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getAnnouncementHistory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(announcementListQuerySchema, req.query);
    const data = await AnnouncementService.getHistory(authReq.user.companyId, query);
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
    const data = await AnnouncementService.acknowledge(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listChannels: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(channelListQuerySchema, req.query);
    const perms = await permissions(authReq);
    const data = await ChannelService.list(actor(authReq), perms, query);
    return ResponseService.paginated(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createChannel: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createChannelSchema, req.body);
    const perms = await permissions(authReq);
    const data = await ChannelService.create(actor(authReq), perms, payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getChannel: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    const data = await ChannelService.getById(actor(authReq), perms, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateChannel: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateChannelSchema, req.body);
    const perms = await permissions(authReq);
    const data = await ChannelService.update(actor(authReq), perms, id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteChannel: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const perms = await permissions(authReq);
    const data = await ChannelService.delete(actor(authReq), perms, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getChannelMembers: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ChannelService.getMembers(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listDirectConversations: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await DirectMessageService.list(actor(authReq), query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createDirectConversation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { targetEmployeeId } = validateInput(directConversationSchema, req.body);
    const data = await DirectMessageService.findOrCreate(actor(authReq), targetEmployeeId);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listMessages: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const query = validateInput(listQuerySchema, req.query);
    const data = await MessageService.list(actor(authReq), id, query);
    return ResponseService.paginated(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const sendMessage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(sendMessageSchema, req.body);
    const data = await MessageService.send(actor(authReq), id, payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateMessage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateMessageSchema, req.body);
    const data = await MessageService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteMessage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await MessageService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const forwardMessage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { targetConversationId } = validateInput(forwardMessageSchema, req.body);
    const data = await MessageService.forward(actor(authReq), id, targetConversationId);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const starMessage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await MessageService.star(actor(authReq), id, true);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const markMessageRead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await MessageService.markRead(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listNotifications: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(notificationListQuerySchema, req.query);
    const data = await NotificationCenterService.list(actor(authReq), query);
    return ResponseService.paginated(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const markNotificationRead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await NotificationCenterService.markRead(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const markAllNotificationsRead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await NotificationCenterService.markAllRead(actor(authReq));
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
    const data = await NotificationCenterService.archive(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getInbox: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await InboxService.getInbox(actor(authReq), query);
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
    const perms = await permissions(authReq);
    const data = await CommunicationSearchService.search(actor(authReq), perms, query);
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
    const data = await CommunicationReportService.generate(authReq.user.companyId, query);
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
    const csv = await CommunicationReportService.exportCsv(authReq.user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=communication-report.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};
