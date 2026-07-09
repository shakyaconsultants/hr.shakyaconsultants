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
  createDirectConversation,
  deleteAnnouncement,
  deleteMessage,
  forwardMessage,
  getAnnouncement,
  getAnnouncementStats,
  getCompanyChat,
  listAnnouncements,
  listDirectConversations,
  listEmployeeDirectConversations,
  listMessages,
  listNotifications,
  markAllNotificationsRead,
  markMessageRead,
  markNotificationRead,
  publishAnnouncement,
  sendMessage,
  starMessage,
  updateAnnouncement,
  updateMessage,
} from '@modules/communication/controllers/communication.controller.js';

const communicationRoutes = Router();

communicationRoutes.use(authenticateMiddleware);
communicationRoutes.use(companyScopeMiddleware());

communicationRoutes.get(
  '/announcements',
  authorize(ANNOUNCEMENT_PERMISSIONS.READ),
  listAnnouncements,
);
communicationRoutes.post(
  '/announcements',
  authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.CREATE),
  createAnnouncement,
);
communicationRoutes.get(
  '/announcements/:id',
  authorize(ANNOUNCEMENT_PERMISSIONS.READ),
  getAnnouncement,
);
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
communicationRoutes.get(
  '/announcements/:id/stats',
  authorizeAny(BROADCAST_PERMISSIONS.BROADCAST, CONVERSATION_PERMISSIONS.READ),
  getAnnouncementStats,
);
communicationRoutes.post(
  '/announcements/:id/acknowledge',
  authorize(ANNOUNCEMENT_PERMISSIONS.ACKNOWLEDGE),
  acknowledgeAnnouncement,
);

communicationRoutes.get(
  '/conversations/direct',
  authorize(CONVERSATION_PERMISSIONS.READ),
  listDirectConversations,
);
communicationRoutes.get(
  '/conversations/company',
  authorize(CONVERSATION_PERMISSIONS.READ),
  getCompanyChat,
);
communicationRoutes.get(
  '/employees/:id/conversations/direct',
  authorize(CONVERSATION_PERMISSIONS.READ),
  listEmployeeDirectConversations,
);
communicationRoutes.post(
  '/conversations/direct',
  authorize(CONVERSATION_PERMISSIONS.CREATE),
  createDirectConversation,
);
communicationRoutes.get(
  '/conversations/:id/messages',
  authorize(CONVERSATION_PERMISSIONS.READ),
  listMessages,
);
communicationRoutes.post(
  '/conversations/:id/messages',
  authorize(MESSAGE_PERMISSIONS.SEND),
  sendMessage,
);

communicationRoutes.patch('/messages/:id', authorize(MESSAGE_PERMISSIONS.SEND), updateMessage);
communicationRoutes.delete('/messages/:id', authorize(MESSAGE_PERMISSIONS.SEND), deleteMessage);
communicationRoutes.post(
  '/messages/:id/forward',
  authorize(MESSAGE_PERMISSIONS.SEND),
  forwardMessage,
);
communicationRoutes.post('/messages/:id/star', authorize(MESSAGE_PERMISSIONS.SEND), starMessage);
communicationRoutes.post(
  '/messages/:id/read',
  authorize(MESSAGE_PERMISSIONS.SEND),
  markMessageRead,
);

communicationRoutes.get(
  '/notifications',
  authorize(NOTIFICATION_PERMISSIONS.READ),
  listNotifications,
);
communicationRoutes.patch(
  '/notifications/:id/read',
  authorize(NOTIFICATION_PERMISSIONS.UPDATE),
  markNotificationRead,
);
communicationRoutes.post(
  '/notifications/mark-all-read',
  authorize(NOTIFICATION_PERMISSIONS.UPDATE),
  markAllNotificationsRead,
);
communicationRoutes.patch(
  '/notifications/:id/archive',
  authorize(NOTIFICATION_PERMISSIONS.MANAGE),
  archiveNotification,
);

export { communicationRoutes };
