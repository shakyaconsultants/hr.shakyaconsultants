import { NotificationCenterService } from '@modules/communication/services/notification-center.service.js';
import type { NotificationQuery, WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

function toActor(context: WorkspaceActorContext) {
  return {
    companyId: context.companyId,
    userId: context.userId,
    employeeId: context.employeeId,
    ip: context.ip,
    userAgent: context.userAgent,
  };
}

export const WorkspaceNotificationsService = {
  async list(context: WorkspaceActorContext, query: NotificationQuery) {
    return NotificationCenterService.list(toActor(context), query);
  },

  async markRead(context: WorkspaceActorContext, notificationId: string) {
    return NotificationCenterService.markRead(toActor(context), notificationId);
  },

  async markAllRead(context: WorkspaceActorContext) {
    return NotificationCenterService.markAllRead(toActor(context));
  },

  async archive(context: WorkspaceActorContext, notificationId: string) {
    return NotificationCenterService.archive(toActor(context), notificationId);
  },
};
