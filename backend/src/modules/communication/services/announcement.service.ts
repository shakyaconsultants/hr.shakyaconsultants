import {
  AnnouncementRepository,
  ANNOUNCEMENT_AUDIENCE,
  ANNOUNCEMENT_PRIORITY,
} from '@domain/communication/communication.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { AnnouncementReadReceiptRepository } from '@domain/workspace/workspace-extended.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { BROADCAST_PERMISSIONS } from '@modules/communication/constants/communication-permissions.constants.js';
import { COMMUNICATION_NOTIFICATION_JOB } from '@modules/communication/constants/communication.constants.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import { CommunicationEventService } from '@modules/communication/services/communication-event.service.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

interface AnnouncementListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  targetAudience?: string;
}

interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetAudience: string;
  targetIds?: string[];
  priority?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  isPinned?: boolean;
  isEmergency?: boolean;
  requiresAcknowledgement?: boolean;
  attachmentUrls?: string[];
  templateSlug?: string;
}

interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> {
  status?: string;
}

const BROADCAST_AUDIENCES = new Set<string>([
  ANNOUNCEMENT_AUDIENCE.ALL,
  ANNOUNCEMENT_AUDIENCE.BRANCH,
  ANNOUNCEMENT_AUDIENCE.DEPARTMENT,
]);

async function getDirectReportIds(companyId: string, managerEmployeeId: string): Promise<string[]> {
  const reports = await EmployeeRepository.findMany({ reportingManagerId: managerEmployeeId }, { companyId });
  return reports.map((r) => r.id);
}

async function filterAnnouncementsForEmployee(companyId: string, employeeId: string) {
  const employee = await EmployeeRepository.findById(employeeId, { companyId });
  if (!employee) {
    return [];
  }

  const all = await AnnouncementRepository.findMany(
    { status: ENTITY_STATUS.ACTIVE, publishedAt: { $exists: true, $ne: null } },
    { companyId },
  );
  const now = new Date();
  const projectMemberships = await ProjectMemberRepository.findMany({ employeeId }, { companyId });
  const projectIds = projectMemberships.map((m) => m.projectId);

  return all.filter((a) => {
    if (a.expiresAt && new Date(a.expiresAt) < now) {
      return false;
    }
    if (a.scheduledAt && new Date(a.scheduledAt) > now) {
      return false;
    }
    switch (a.targetAudience) {
      case ANNOUNCEMENT_AUDIENCE.ALL:
        return true;
      case ANNOUNCEMENT_AUDIENCE.DEPARTMENT:
        return a.targetIds.includes(employee.departmentId);
      case ANNOUNCEMENT_AUDIENCE.BRANCH:
        return employee.branchId ? a.targetIds.includes(employee.branchId) : false;
      case ANNOUNCEMENT_AUDIENCE.ROLE:
        return employee.designationId ? a.targetIds.includes(employee.designationId) : false;
      case ANNOUNCEMENT_AUDIENCE.TEAM:
        return a.targetIds.some((id) => id === employeeId || id === employee.reportingManagerId);
      case ANNOUNCEMENT_AUDIENCE.PROJECT:
        return a.targetIds.some((id) => projectIds.includes(id));
      default:
        return false;
    }
  });
}

function assertBroadcastPermission(permissions: string[], audience: string, isEmergency?: boolean): void {
  if (BROADCAST_AUDIENCES.has(audience) || isEmergency) {
    if (!permissions.includes(BROADCAST_PERMISSIONS.BROADCAST)) {
      throw new ForbiddenError('Broadcast permission required for company-wide announcements', ERROR_CODES.AUTH_FORBIDDEN);
    }
  }
}

async function assertManagerAudienceScope(
  context: CommunicationActorContext,
  audience: string,
  targetIds: string[],
): Promise<void> {
  if (context.isSuperAdmin) {
    return;
  }
  if (!context.employeeId) {
    throw new ForbiddenError('Employee profile required', ERROR_CODES.AUTH_FORBIDDEN);
  }

  if (audience === ANNOUNCEMENT_AUDIENCE.TEAM) {
    const directReports = await getDirectReportIds(context.companyId, context.employeeId);
    const allowed = new Set([context.employeeId, ...directReports]);
    const invalid = targetIds.filter((id) => !allowed.has(id));
    if (invalid.length > 0) {
      throw new ForbiddenError('Team announcements may only target your direct reports', ERROR_CODES.AUTH_FORBIDDEN);
    }
    return;
  }

  if (audience === ANNOUNCEMENT_AUDIENCE.PROJECT) {
    const memberships = await ProjectMemberRepository.findMany({ employeeId: context.employeeId }, { companyId: context.companyId });
    const allowedProjects = new Set(memberships.map((m) => m.projectId));
    const invalid = targetIds.filter((id) => !allowedProjects.has(id));
    if (invalid.length > 0) {
      throw new ForbiddenError('Project announcements may only target your projects', ERROR_CODES.AUTH_FORBIDDEN);
    }
    return;
  }

  throw new ForbiddenError('Managers may only create team or project announcements', ERROR_CODES.AUTH_FORBIDDEN);
}

export const AnnouncementService = {
  async listAdmin(context: CommunicationActorContext, permissions: string[], query: AnnouncementListQuery) {
    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.targetAudience) filter.targetAudience = query.targetAudience;
    if (query.search) filter.$text = { $search: query.search };

    if (!canBroadcast && context.employeeId) {
      filter.authorUserId = context.userId;
    }

    return AnnouncementRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId: context.companyId });
  },

  async listForEmployee(context: CommunicationActorContext, query: AnnouncementListQuery) {
    if (!context.employeeId) {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    }

    const announcements = await filterAnnouncementsForEmployee(context.companyId, context.employeeId);
    const receipts = await AnnouncementReadReceiptRepository.findMany(
      { employeeId: context.employeeId },
      { companyId: context.companyId },
    );
    const receiptMap = new Map(receipts.map((r) => [r.announcementId, r]));

    let filtered = announcements;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = announcements.filter(
        (a) => a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term),
      );
    }

    const sorted = filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return (b.publishedAt?.getTime() ?? b.createdAt.getTime()) - (a.publishedAt?.getTime() ?? a.createdAt.getTime());
    });

    const enriched = sorted.map((a) => {
      const receipt = receiptMap.get(a.id);
      return {
        ...CommunicationAuditService.toRecord(a),
        readReceipt: receipt ? CommunicationAuditService.toRecord(receipt) : null,
        isRead: receiptMap.has(a.id),
        isAcknowledged: Boolean(receipt?.acknowledgedAt),
      };
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;

    return { items: enriched.slice(start, start + pageSize), total: enriched.length, page, pageSize };
  },

  async getById(context: CommunicationActorContext, announcementId: string) {
    if (!context.employeeId) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const announcements = await filterAnnouncementsForEmployee(context.companyId, context.employeeId);
    const announcement = announcements.find((a) => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    let receipt = await AnnouncementReadReceiptRepository.findOne(
      { announcementId, employeeId: context.employeeId },
      { companyId: context.companyId },
    );

    if (!receipt) {
      receipt = await AnnouncementReadReceiptRepository.create(
        {
          id: generateUuid(),
          companyId: context.companyId,
          announcementId,
          employeeId: context.employeeId,
          readAt: new Date(),
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }

    return {
      announcement: CommunicationAuditService.toRecord(announcement),
      readReceipt: CommunicationAuditService.toRecord(receipt),
    };
  },

  async getAdminById(companyId: string, id: string) {
    const announcement = await AnnouncementRepository.findById(id, { companyId });
    if (!announcement) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }
    return CommunicationAuditService.toRecord(announcement);
  },

  async create(context: CommunicationActorContext, permissions: string[], input: CreateAnnouncementInput) {
    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    const targetIds = input.targetIds ?? [];

    if (canBroadcast) {
      assertBroadcastPermission(permissions, input.targetAudience, input.isEmergency);
    } else {
      await assertManagerAudienceScope(context, input.targetAudience, targetIds);
    }

    const announcement = await AnnouncementRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        title: input.title,
        content: input.content,
        targetAudience: input.targetAudience,
        targetIds,
        priority: input.priority ?? ANNOUNCEMENT_PRIORITY.NORMAL,
        status: ENTITY_STATUS.PENDING,
        scheduledAt: input.scheduledAt,
        expiresAt: input.expiresAt,
        isPinned: input.isPinned ?? false,
        isEmergency: input.isEmergency ?? false,
        requiresAcknowledgement: input.requiresAcknowledgement ?? false,
        authorEmployeeId: context.employeeId,
        authorUserId: context.userId,
        attachmentUrls: input.attachmentUrls ?? [],
        templateSlug: input.templateSlug,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'announcement',
      entityId: announcement.id,
      action: 'create',
      after: CommunicationAuditService.toRecord(announcement),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(announcement);
  },

  async update(context: CommunicationActorContext, permissions: string[], id: string, input: UpdateAnnouncementInput) {
    const existing = await AnnouncementRepository.findById(id, { companyId: context.companyId });
    if (!existing) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    if (!canBroadcast && existing.authorUserId !== context.userId) {
      throw new ForbiddenError('Cannot update this announcement', ERROR_CODES.AUTH_FORBIDDEN);
    }

    const audience = input.targetAudience ?? existing.targetAudience;
    const targetIds = input.targetIds ?? existing.targetIds;
    if (canBroadcast) {
      assertBroadcastPermission(permissions, audience, input.isEmergency ?? existing.isEmergency);
    } else if (input.targetAudience || input.targetIds) {
      await assertManagerAudienceScope(context, audience, targetIds);
    }

    const updated = await AnnouncementRepository.update(id, { ...input, updatedBy: context.userId }, { companyId: context.companyId });

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'announcement',
      entityId: id,
      action: 'update',
      before: CommunicationAuditService.toRecord(existing),
      after: CommunicationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(updated);
  },

  async delete(context: CommunicationActorContext, permissions: string[], id: string) {
    const existing = await AnnouncementRepository.findById(id, { companyId: context.companyId });
    if (!existing) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    if (!canBroadcast && existing.authorUserId !== context.userId) {
      throw new ForbiddenError('Cannot delete this announcement', ERROR_CODES.AUTH_FORBIDDEN);
    }

    await AnnouncementRepository.update(id, { status: ENTITY_STATUS.ARCHIVED, updatedBy: context.userId }, { companyId: context.companyId });

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'announcement',
      entityId: id,
      action: 'delete',
      before: CommunicationAuditService.toRecord(existing),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { id, deleted: true };
  },

  async publish(context: CommunicationActorContext, permissions: string[], id: string) {
    const existing = await AnnouncementRepository.findById(id, { companyId: context.companyId });
    if (!existing) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const canBroadcast = permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);
    if (!canBroadcast && existing.authorUserId !== context.userId) {
      throw new ForbiddenError('Cannot publish this announcement', ERROR_CODES.AUTH_FORBIDDEN);
    }

    if (BROADCAST_AUDIENCES.has(existing.targetAudience) || existing.isEmergency) {
      assertBroadcastPermission(permissions, existing.targetAudience, existing.isEmergency);
    } else if (!canBroadcast) {
      await assertManagerAudienceScope(context, existing.targetAudience, existing.targetIds);
    }

    const now = new Date();
    const updated = await AnnouncementRepository.update(
      id,
      { publishedAt: now, status: ENTITY_STATUS.ACTIVE, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CommunicationEventService.publishActivity(context, {
      activityType: 'announcement.published',
      description: `Published announcement: ${existing.title}`,
      entityType: 'announcement',
      entityId: id,
    });

    const jobName = existing.isEmergency
      ? COMMUNICATION_NOTIFICATION_JOB.ANNOUNCEMENT_EMERGENCY
      : COMMUNICATION_NOTIFICATION_JOB.ANNOUNCEMENT_PUBLISHED;

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'announcement',
      entityId: id,
      action: 'publish',
      after: { publishedAt: now, title: existing.title, jobName },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return CommunicationAuditService.toRecord(updated);
  },

  async getStats(companyId: string, id: string) {
    const announcement = await AnnouncementRepository.findById(id, { companyId });
    if (!announcement) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const receipts = await AnnouncementReadReceiptRepository.findMany({ announcementId: id }, { companyId });
    const readCount = receipts.length;
    const acknowledgedCount = receipts.filter((r) => r.acknowledgedAt).length;

    return {
      announcementId: id,
      title: announcement.title,
      readCount,
      acknowledgedCount,
      requiresAcknowledgement: announcement.requiresAcknowledgement,
      publishedAt: announcement.publishedAt,
    };
  },

  async getHistory(companyId: string, query: AnnouncementListQuery) {
    const filter: Record<string, unknown> = {
      publishedAt: { $exists: true, $ne: null },
    };
    if (query.search) filter.$text = { $search: query.search };

    return AnnouncementRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    }, { companyId });
  },

  async acknowledge(context: CommunicationActorContext, announcementId: string) {
    if (!context.employeeId) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const announcements = await filterAnnouncementsForEmployee(context.companyId, context.employeeId);
    const announcement = announcements.find((a) => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundError('Announcement not found', ERROR_CODES.NOT_FOUND);
    }

    const existing = await AnnouncementReadReceiptRepository.findOne(
      { announcementId, employeeId: context.employeeId },
      { companyId: context.companyId },
    );

    const now = new Date();
    let receipt;
    if (existing) {
      receipt = await AnnouncementReadReceiptRepository.update(
        existing.id,
        { acknowledgedAt: now, readAt: existing.readAt, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    } else {
      receipt = await AnnouncementReadReceiptRepository.create(
        {
          id: generateUuid(),
          companyId: context.companyId,
          announcementId,
          employeeId: context.employeeId,
          readAt: now,
          acknowledgedAt: now,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'announcement',
      entityId: announcementId,
      action: 'acknowledge',
      after: { title: announcement.title, acknowledgedAt: now },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await CommunicationEventService.publishActivity(context, {
      activityType: 'announcement.acknowledged',
      description: `Acknowledged announcement: ${announcement.title}`,
      entityType: 'announcement',
      entityId: announcementId,
    });

    return CommunicationAuditService.toRecord(receipt);
  },
};
