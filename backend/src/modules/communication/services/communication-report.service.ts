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
import { COMMUNICATION_REPORT_TYPE } from '@modules/communication/constants/communication.constants.js';

interface ReportQuery {
  type: string;
  startDate?: string;
  endDate?: string;
  channelId?: string;
  employeeId?: string;
}

function dateRangeFilter(
  startDate?: string,
  endDate?: string,
): Record<string, unknown> | undefined {
  if (!startDate && !endDate) return undefined;
  const filter: Record<string, unknown> = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return filter;
}

export const CommunicationReportService = {
  async generate(companyId: string, query: ReportQuery) {
    switch (query.type) {
      case COMMUNICATION_REPORT_TYPE.REACH:
        return this.reachReport(companyId, query);
      case COMMUNICATION_REPORT_TYPE.READ_STATS:
        return this.readStatsReport(companyId, query);
      case COMMUNICATION_REPORT_TYPE.CHANNEL_ACTIVITY:
        return this.channelActivityReport(companyId, query);
      case COMMUNICATION_REPORT_TYPE.USER_ACTIVITY:
        return this.userActivityReport(companyId, query);
      case COMMUNICATION_REPORT_TYPE.UNREAD_SUMMARY:
        return this.unreadSummaryReport(companyId, query);
      default:
        return this.reachReport(companyId, query);
    }
  },

  async reachReport(companyId: string, query: ReportQuery) {
    const createdAt = dateRangeFilter(query.startDate, query.endDate);
    const filter: Record<string, unknown> = {
      status: ENTITY_STATUS.ACTIVE,
      publishedAt: { $exists: true },
    };
    if (createdAt) filter.publishedAt = createdAt;

    const announcements = await AnnouncementRepository.findMany(filter, { companyId });
    const employees = await EmployeeRepository.findMany({}, { companyId });

    return {
      type: COMMUNICATION_REPORT_TYPE.REACH,
      totalAnnouncements: announcements.length,
      totalEmployees: employees.length,
      emergencyCount: announcements.filter((a) => a.isEmergency).length,
      pinnedCount: announcements.filter((a) => a.isPinned).length,
    };
  },

  async readStatsReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.startDate || query.endDate) {
      const readAt = dateRangeFilter(query.startDate, query.endDate);
      if (readAt) filter.readAt = readAt;
    }

    const receipts = await AnnouncementReadReceiptRepository.findMany(filter, { companyId });
    const acknowledged = receipts.filter((r) => r.acknowledgedAt);

    return {
      type: COMMUNICATION_REPORT_TYPE.READ_STATS,
      totalReads: receipts.length,
      totalAcknowledged: acknowledged.length,
      acknowledgementRate:
        receipts.length > 0 ? Math.round((acknowledged.length / receipts.length) * 100) : 0,
    };
  },

  async channelActivityReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = { type: CONVERSATION_TYPE.CHANNEL };
    if (query.channelId) filter.id = query.channelId;

    const channels = await ConversationRepository.findMany(filter, { companyId });
    const messageFilter: Record<string, unknown> = {};
    const createdAt = dateRangeFilter(query.startDate, query.endDate);
    if (createdAt) messageFilter.createdAt = createdAt;

    const activity = await Promise.all(
      channels.map(async (channel) => {
        const messages = await MessageRepository.findMany(
          { conversationId: channel.id, isDeleted: false, ...messageFilter },
          { companyId },
        );
        return {
          channelId: channel.id,
          title: channel.title,
          messageCount: messages.length,
          participantCount: channel.participantIds.length,
          lastMessageAt: channel.lastMessageAt,
        };
      }),
    );

    return { type: COMMUNICATION_REPORT_TYPE.CHANNEL_ACTIVITY, channels: activity };
  },

  async userActivityReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.employeeId) filter.senderId = query.employeeId;
    const createdAt = dateRangeFilter(query.startDate, query.endDate);
    if (createdAt) filter.createdAt = createdAt;

    const messages = await MessageRepository.findMany(filter, { companyId });
    const bySender: Record<string, number> = {};
    for (const message of messages) {
      bySender[message.senderId] = (bySender[message.senderId] ?? 0) + 1;
    }

    return {
      type: COMMUNICATION_REPORT_TYPE.USER_ACTIVITY,
      totalMessages: messages.length,
      bySender,
    };
  },

  async unreadSummaryReport(companyId: string, query: ReportQuery) {
    const notificationFilter: Record<string, unknown> = {
      readAt: { $exists: false },
      isArchived: false,
    };
    const messageFilter: Record<string, unknown> = { readAt: { $exists: false } };

    if (query.employeeId) {
      notificationFilter.recipientId = query.employeeId;
      messageFilter.recipientId = query.employeeId;
    }

    const [unreadNotifications, unreadReceipts] = await Promise.all([
      NotificationRepository.findMany(notificationFilter, { companyId }),
      MessageReceiptRepository.findMany(messageFilter, { companyId }),
    ]);

    return {
      type: COMMUNICATION_REPORT_TYPE.UNREAD_SUMMARY,
      unreadNotifications: unreadNotifications.length,
      unreadMessages: unreadReceipts.length,
    };
  },

  async exportCsv(companyId: string, query: ReportQuery): Promise<string> {
    const report = await this.generate(companyId, query);
    const headers = ['metric', 'value'];
    const rows: string[][] = [];

    if ('totalAnnouncements' in report) {
      rows.push(['totalAnnouncements', String(report.totalAnnouncements)]);
      rows.push(['totalEmployees', String(report.totalEmployees)]);
      rows.push(['emergencyCount', String(report.emergencyCount)]);
    } else if ('totalReads' in report) {
      rows.push(['totalReads', String(report.totalReads)]);
      rows.push(['totalAcknowledged', String(report.totalAcknowledged)]);
      rows.push(['acknowledgementRate', String(report.acknowledgementRate)]);
    } else if ('channels' in report && Array.isArray(report.channels)) {
      return [
        'channelId,title,messageCount,participantCount,lastMessageAt',
        ...report.channels.map((c) =>
          [
            c.channelId,
            `"${c.title ?? ''}"`,
            c.messageCount,
            c.participantCount,
            c.lastMessageAt?.toISOString() ?? '',
          ].join(','),
        ),
      ].join('\n');
    } else {
      rows.push(['data', JSON.stringify(report)]);
    }

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
