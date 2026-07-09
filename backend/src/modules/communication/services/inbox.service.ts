import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_CATEGORY } from '@domain/communication/communication.schemas.js';
import { INBOX_CATEGORIES } from '@modules/communication/constants/communication.constants.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

const CATEGORY_MAP: Record<string, string> = {
  approval: NOTIFICATION_CATEGORY.APPROVAL,
  payroll: NOTIFICATION_CATEGORY.PAYROLL,
  attendance: NOTIFICATION_CATEGORY.ATTENDANCE,
  leave: NOTIFICATION_CATEGORY.LEAVE,
  interview: NOTIFICATION_CATEGORY.INTERVIEW,
  assignment: NOTIFICATION_CATEGORY.ASSIGNMENT,
  system: NOTIFICATION_CATEGORY.SYSTEM,
};

interface InboxQuery {
  page?: number;
  pageSize?: number;
}

export const InboxService = {
  async getInbox(context: CommunicationActorContext, query: InboxQuery) {
    const notifications = await NotificationRepository.findMany(
      { recipientId: context.userId, isArchived: false },
      { companyId: context.companyId },
    );

    const unread = notifications.filter((n) => !n.readAt);
    const categories: Record<
      string,
      { total: number; unread: number; items: typeof notifications }
    > = {};

    for (const key of INBOX_CATEGORIES) {
      const categoryValue = CATEGORY_MAP[key] ?? key;
      const items = notifications.filter((n) => (n.category ?? 'general') === categoryValue);
      categories[key] = {
        total: items.length,
        unread: items.filter((n) => !n.readAt).length,
        items: items.slice(0, query.pageSize ?? 10),
      };
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sorted = [...notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = (page - 1) * pageSize;

    return {
      totalNotifications: notifications.length,
      totalUnread: unread.length,
      categories,
      recent: sorted.slice(start, start + pageSize),
      page,
      pageSize,
    };
  },
};
