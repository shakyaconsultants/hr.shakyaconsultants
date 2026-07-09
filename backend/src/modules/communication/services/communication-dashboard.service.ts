import {
  AnnouncementRepository,
  ConversationRepository,
  MessageRepository,
  MessageReceiptRepository,
  NotificationRepository,
  CONVERSATION_TYPE,
} from '@domain/communication/communication.schemas.js';
import { AnnouncementReadReceiptRepository } from '@domain/workspace/workspace-extended.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

interface DashboardQuery {
  startDate?: string;
  endDate?: string;
}

export const CommunicationDashboardService = {
  async getEnterpriseDashboard(companyId: string, _query?: DashboardQuery) {
    const [announcements, channels, messages, notifications] = await Promise.all([
      AnnouncementRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
      ConversationRepository.findMany({ type: CONVERSATION_TYPE.CHANNEL }, { companyId }),
      MessageRepository.findMany({ isDeleted: false }, { companyId }),
      NotificationRepository.findMany({ isArchived: false }, { companyId }),
    ]);

    const receipts = await AnnouncementReadReceiptRepository.findMany({}, { companyId });

    return {
      totalAnnouncements: announcements.length,
      activeChannels: channels.length,
      totalMessages: messages.length,
      totalNotifications: notifications.length,
      announcementReads: receipts.length,
      emergencyAnnouncements: announcements.filter((a) => a.isEmergency).length,
    };
  },

  async getManagerDashboard(context: CommunicationActorContext, _query?: DashboardQuery) {
    if (!context.employeeId) {
      return { teamChannels: 0, teamAnnouncements: 0, unreadNotifications: 0 };
    }

    const directReports = await EmployeeRepository.findMany(
      { reportingManagerId: context.employeeId },
      { companyId: context.companyId },
    );
    const teamIds = [context.employeeId, ...directReports.map((e) => e.id)];

    const [channels, announcements, notifications] = await Promise.all([
      ConversationRepository.findMany(
        { type: CONVERSATION_TYPE.CHANNEL, participantIds: { $in: teamIds } },
        { companyId: context.companyId },
      ),
      AnnouncementRepository.findMany(
        { authorUserId: context.userId },
        { companyId: context.companyId },
      ),
      NotificationRepository.findMany(
        { recipientId: context.userId, readAt: { $exists: false }, isArchived: false },
        { companyId: context.companyId },
      ),
    ]);

    return {
      teamSize: directReports.length,
      teamChannels: channels.length,
      teamAnnouncements: announcements.length,
      unreadNotifications: notifications.length,
    };
  },

  async getWorkspaceDashboard(context: CommunicationActorContext, _query?: DashboardQuery) {
    const [notifications, channels, messages] = await Promise.all([
      NotificationRepository.findMany(
        { recipientId: context.userId, isArchived: false },
        { companyId: context.companyId },
      ),
      context.employeeId
        ? ConversationRepository.findMany(
            { participantIds: context.employeeId },
            { companyId: context.companyId },
          )
        : Promise.resolve([]),
      context.employeeId
        ? MessageReceiptRepository.findMany(
            { recipientId: context.employeeId, readAt: { $exists: false } },
            { companyId: context.companyId },
          ).then((r) => r.length)
        : Promise.resolve(0),
    ]);

    const unreadNotifications = notifications.filter((n) => !n.readAt).length;
    const unreadMessages = typeof messages === 'number' ? messages : 0;

    return {
      unreadNotifications,
      unreadMessages,
      activeConversations: channels.length,
      recentNotificationCount: notifications.slice(0, 5).length,
    };
  },
};
