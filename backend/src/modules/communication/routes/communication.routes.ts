import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize, authorizeAny } from '@modules/rbac/middleware/authorize.middleware.js';
import {
  ANNOUNCEMENT_PERMISSIONS,
  BROADCAST_PERMISSIONS,
  CONVERSATION_PERMISSIONS,
  MESSAGE_PERMISSIONS,
  NOTIFICATION_PERMISSIONS,
} from '@modules/communication/constants/communication-permissions.constants.js';
import {
  acknowledgeAnnouncement,
  archiveNotification,
  createAnnouncement,
  createChannel,
  createDirectConversation,
  deleteAnnouncement,
  deleteChannel,
  deleteMessage,
  exportReports,
  forwardMessage,
  getAnnouncement,
  getAnnouncementHistory,
  getAnnouncementStats,
  getChannel,
  getChannelMembers,
  getEnterpriseDashboard,
  getInbox,
  getManagerDashboard,
  getPolicies,
  getReports,
  getSettings,
  getWorkspaceDashboard,
  listAnnouncements,
  listChannels,
  listDirectConversations,
  listEmployeeDirectConversations,
  listMessages,
  listNotifications,
  markAllNotificationsRead,
  markMessageRead,
  markNotificationRead,
  publishAnnouncement,
  search,
  sendMessage,
  starMessage,
  updateAnnouncement,
  updateChannel,
  updateMessage,
  updatePolicies,
  updateSettings,
} from '@modules/communication/controllers/communication.controller.js';

const communicationRoutes = Router();

communicationRoutes.use(authenticateMiddleware);
communicationRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Communication] */
communicationRoutes.get('/dashboard/enterprise', authorize(BROADCAST_PERMISSIONS.BROADCAST), getEnterpriseDashboard);
communicationRoutes.get('/dashboard/manager', authorize(CONVERSATION_PERMISSIONS.READ), getManagerDashboard);
communicationRoutes.get('/dashboard/workspace', authorize(NOTIFICATION_PERMISSIONS.READ), getWorkspaceDashboard);

communicationRoutes.get('/policies', authorize(CONVERSATION_PERMISSIONS.READ), getPolicies);
communicationRoutes.patch('/policies', authorize(BROADCAST_PERMISSIONS.BROADCAST), updatePolicies);
communicationRoutes.get('/settings', authorize(CONVERSATION_PERMISSIONS.READ), getSettings);
communicationRoutes.patch('/settings', authorize(BROADCAST_PERMISSIONS.BROADCAST), updateSettings);

communicationRoutes.get('/announcements', authorize(ANNOUNCEMENT_PERMISSIONS.READ), listAnnouncements);
communicationRoutes.post(
  '/announcements',
  authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.CREATE),
  createAnnouncement,
);
communicationRoutes.get('/announcements/history', authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.CREATE), getAnnouncementHistory);
communicationRoutes.get('/announcements/:id', authorize(ANNOUNCEMENT_PERMISSIONS.READ), getAnnouncement);
communicationRoutes.patch(
  '/announcements/:id',
  authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.UPDATE),
  updateAnnouncement,
);
communicationRoutes.delete(
  '/announcements/:id',
  authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.DELETE),
  deleteAnnouncement,
);
communicationRoutes.post(
  '/announcements/:id/publish',
  authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.UPDATE),
  publishAnnouncement,
);
communicationRoutes.get('/announcements/:id/stats', authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.READ), getAnnouncementStats);
communicationRoutes.post('/announcements/:id/acknowledge', authorize(ANNOUNCEMENT_PERMISSIONS.ACKNOWLEDGE), acknowledgeAnnouncement);

communicationRoutes.get('/channels', authorize(CONVERSATION_PERMISSIONS.READ), listChannels);
communicationRoutes.post('/channels', authorize(CONVERSATION_PERMISSIONS.CREATE), createChannel);
communicationRoutes.get('/channels/:id', authorize(CONVERSATION_PERMISSIONS.READ), getChannel);
communicationRoutes.patch('/channels/:id', authorize(CONVERSATION_PERMISSIONS.UPDATE), updateChannel);
communicationRoutes.delete('/channels/:id', authorize(CONVERSATION_PERMISSIONS.DELETE), deleteChannel);
communicationRoutes.get('/channels/:id/members', authorize(CONVERSATION_PERMISSIONS.READ), getChannelMembers);

communicationRoutes.get('/conversations/direct', authorize(CONVERSATION_PERMISSIONS.READ), listDirectConversations);
communicationRoutes.get('/employees/:id/conversations/direct', authorize(CONVERSATION_PERMISSIONS.READ), listEmployeeDirectConversations);
communicationRoutes.post('/conversations/direct', authorize(CONVERSATION_PERMISSIONS.CREATE), createDirectConversation);
communicationRoutes.get('/conversations/:id/messages', authorize(CONVERSATION_PERMISSIONS.READ), listMessages);
communicationRoutes.post('/conversations/:id/messages', authorize(MESSAGE_PERMISSIONS.SEND), sendMessage);

communicationRoutes.patch('/messages/:id', authorize(MESSAGE_PERMISSIONS.SEND), updateMessage);
communicationRoutes.delete('/messages/:id', authorize(MESSAGE_PERMISSIONS.SEND), deleteMessage);
communicationRoutes.post('/messages/:id/forward', authorize(MESSAGE_PERMISSIONS.SEND), forwardMessage);
communicationRoutes.post('/messages/:id/star', authorize(MESSAGE_PERMISSIONS.SEND), starMessage);
communicationRoutes.post('/messages/:id/read', authorize(MESSAGE_PERMISSIONS.SEND), markMessageRead);

communicationRoutes.get('/notifications', authorize(NOTIFICATION_PERMISSIONS.READ), listNotifications);
communicationRoutes.patch('/notifications/:id/read', authorize(NOTIFICATION_PERMISSIONS.UPDATE), markNotificationRead);
communicationRoutes.post('/notifications/mark-all-read', authorize(NOTIFICATION_PERMISSIONS.UPDATE), markAllNotificationsRead);
communicationRoutes.patch('/notifications/:id/archive', authorize(NOTIFICATION_PERMISSIONS.MANAGE), archiveNotification);

communicationRoutes.get('/inbox', authorize(NOTIFICATION_PERMISSIONS.READ), getInbox);
communicationRoutes.get('/search', authorize(CONVERSATION_PERMISSIONS.READ), search);

communicationRoutes.get('/reports', authorize(BROADCAST_PERMISSIONS.BROADCAST), getReports);
communicationRoutes.get('/reports/export', authorize(BROADCAST_PERMISSIONS.BROADCAST), exportReports);

export { communicationRoutes };
