import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_STATUS } from '@shared/constants/notification.constants.js';
import { NotFoundError, ForbiddenError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import { BROADCAST_PERMISSIONS, NOTIFICATION_PERMISSIONS } from '@modules/communication/constants/communication-permissions.constants.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import { CommunicationPolicyService } from '@modules/communication/services/communication-policy.service.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

interface NotificationListQuery {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  isArchived?: boolean;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const NotificationCenterService = {
  async list(context: CommunicationActorContext, query: NotificationListQuery) {
    const filters: Record<string, unknown>[] = [{ recipientId: context.userId }];

    if (query.isArchived !== undefined) {
      filters.push({ isArchived: query.isArchived });
    } else {
      filters.push({ isArchived: false });
    }

    if (query.isRead === true) {
      filters.push({ readAt: { $exists: true, $ne: null } });
    } else if (query.isRead === false) {
      filters.push({ $or: [{ readAt: { $exists: false } }, { readAt: null }] });
    }

    if (query.category) {
      filters.push({ category: query.category });
    }

    const filter = mergeFilters(...filters);
    const result = await NotificationRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    }, { companyId: context.companyId });

    const grouped = result.items.reduce<Record<string, typeof result.items>>((acc, item) => {
      const key = item.category ?? 'general';
      acc[key] = [...(acc[key] ?? []), item];
      return acc;
    }, {});

    return { ...result, grouped };
  },

  async markRead(context: CommunicationActorContext, notificationId: string) {
    const notification = await NotificationRepository.findById(notificationId, { companyId: context.companyId });
    if (!notification || notification.recipientId !== context.userId) {
      throw new NotFoundError('Notification not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await NotificationRepository.update(
      notificationId,
      { readAt: new Date(), status: NOTIFICATION_STATUS.READ, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'notification',
      entityId: notificationId,
      action: 'read',
      after: CommunicationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(updated);
  },

  async markAllRead(context: CommunicationActorContext) {
    const notifications = await NotificationRepository.findMany(
      { recipientId: context.userId, readAt: { $exists: false } },
      { companyId: context.companyId },
    );

    const now = new Date();
    for (const notification of notifications) {
      await NotificationRepository.update(
        notification.id,
        { readAt: now, status: NOTIFICATION_STATUS.READ, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    return { count: notifications.length };
  },

  async archive(context: CommunicationActorContext, notificationId: string) {
    const notification = await NotificationRepository.findById(notificationId, { companyId: context.companyId });
    if (!notification || notification.recipientId !== context.userId) {
      throw new NotFoundError('Notification not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await NotificationRepository.update(
      notificationId,
      { isArchived: true, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'notification',
      entityId: notificationId,
      action: 'archive',
      after: CommunicationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(updated);
  },

  async getPreferences(companyId: string) {
    return CommunicationPolicyService.getPreferencesForUser(companyId);
  },

  async adminDelete(context: CommunicationActorContext, permissions: string[], notificationId: string) {
    if (!permissions.includes(NOTIFICATION_PERMISSIONS.DELETE) && !permissions.includes(BROADCAST_PERMISSIONS.BROADCAST)) {
      throw new ForbiddenError('Notification delete permission required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const notification = await NotificationRepository.findById(notificationId, { companyId: context.companyId });
    if (!notification) {
      throw new NotFoundError('Notification not found', ERROR_CODES.NOT_FOUND);
    }

    await NotificationRepository.update(
      notificationId,
      { isArchived: true, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    return { id: notificationId, deleted: true };
  },

  async adminList(context: CommunicationActorContext, permissions: string[], query: NotificationListQuery) {
    if (!permissions.includes(NOTIFICATION_PERMISSIONS.MANAGE) && !permissions.includes(BROADCAST_PERMISSIONS.BROADCAST)) {
      throw new ForbiddenError('Notification manage permission required', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const filter: Record<string, unknown> = {};
    if (query.category) filter.category = query.category;
    if (query.isArchived !== undefined) filter.isArchived = query.isArchived;

    return NotificationRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    }, { companyId: context.companyId });
  },
};
