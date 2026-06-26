import { AnnouncementService } from '@modules/communication/services/announcement.service.js';
import type { WorkspaceActorContext, WorkspaceListQuery } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceAnnouncementsService = {
  async list(context: WorkspaceActorContext, query: WorkspaceListQuery) {
    return AnnouncementService.listForEmployee(
      {
        companyId: context.companyId,
        userId: context.userId,
        employeeId: context.employeeId,
        ip: context.ip,
        userAgent: context.userAgent,
      },
      query,
    );
  },

  async getById(context: WorkspaceActorContext, announcementId: string) {
    return AnnouncementService.getById(
      {
        companyId: context.companyId,
        userId: context.userId,
        employeeId: context.employeeId,
        ip: context.ip,
        userAgent: context.userAgent,
      },
      announcementId,
    );
  },

  async acknowledge(context: WorkspaceActorContext, announcementId: string) {
    return AnnouncementService.acknowledge(
      {
        companyId: context.companyId,
        userId: context.userId,
        employeeId: context.employeeId,
        ip: context.ip,
        userAgent: context.userAgent,
      },
      announcementId,
    );
  },
};
