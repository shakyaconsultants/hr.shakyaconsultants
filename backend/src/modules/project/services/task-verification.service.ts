import { TaskVerificationRepository, VERIFICATION_STATUS } from '@domain/project/project-extended.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { TaskService } from '@modules/project/services/task.service.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectValidationService } from '@modules/project/services/project-validation.service.js';
import { ProjectEventService, PROJECT_EVENT } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import { resolveNotificationUserId } from '@modules/project/utils/project-notification.util.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const TaskVerificationService = {
  async submit(context: ProjectActorContext, taskId: string, verifierId: string) {
    const task = await TaskService.getById(context.companyId, taskId);
    ProjectValidationService.assertTaskCanBeVerified(task.status);
    await ProjectValidationService.assertValidVerifier(context.companyId, task.projectId, verifierId);

    const id = generateUuid();
    const verification = await TaskVerificationRepository.create(
      {
        id,
        companyId: context.companyId,
        taskId,
        projectId: task.projectId,
        submittedBy: context.userId,
        verifierId,
        status: VERIFICATION_STATUS.PENDING,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task_verification',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(verification),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return verification;
  },

  async approve(context: ProjectActorContext, verificationId: string, comment?: string) {
    const verification = await TaskVerificationRepository.findById(verificationId, { companyId: context.companyId });
    if (!verification) {
      throw new NotFoundError('Verification not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await TaskVerificationRepository.update(
      verificationId,
      {
        status: VERIFICATION_STATUS.APPROVED,
        comment,
        verifiedAt: new Date(),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await TaskRepository.update(
      verification.taskId,
      { status: PROJECT_TASK_STATUS.VERIFIED, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task_verification',
      entityId: verificationId,
      action: 'verify',
      before: ProjectAuditService.toRecord(verification),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await ProjectEventService.emit(context, {
      activityType: ProjectActivityService.TYPES.TASK_VERIFIED,
      activityDescription: `Task verification approved`,
      entityType: 'task',
      entityId: verification.taskId,
    });

    const task = await TaskRepository.findById(verification.taskId, { companyId: context.companyId });
    if (task?.assigneeId) {
      const assigneeUserId = await resolveNotificationUserId(context.companyId, task.assigneeId);
      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.TASK_VERIFIED,
        activityDescription: `Task "${task.title}" verification approved`,
        entityType: 'task',
        entityId: verification.taskId,
        notification: {
          userId: assigneeUserId,
          title: 'Task Approved',
          message: comment ? `Your task "${task.title}" was approved: ${comment}` : `Your task "${task.title}" was approved`,
          entityType: 'task',
          entityId: verification.taskId,
          jobName: PROJECT_EVENT.TASK_COMPLETED,
        },
      });
    }

    return updated;
  },

  async reject(context: ProjectActorContext, verificationId: string, comment: string, revisionNotes?: string) {
    const verification = await TaskVerificationRepository.findById(verificationId, { companyId: context.companyId });
    if (!verification) {
      throw new NotFoundError('Verification not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await TaskVerificationRepository.update(
      verificationId,
      {
        status: VERIFICATION_STATUS.REJECTED,
        comment,
        revisionNotes,
        verifiedAt: new Date(),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await TaskRepository.update(
      verification.taskId,
      { status: PROJECT_TASK_STATUS.REJECTED, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task_verification',
      entityId: verificationId,
      action: 'reject',
      before: ProjectAuditService.toRecord(verification),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const task = await TaskRepository.findById(verification.taskId, { companyId: context.companyId });
    const submitterUserId = verification.submittedBy;

    await ProjectEventService.emit(context, {
      activityType: ProjectActivityService.TYPES.TASK_REJECTED,
      activityDescription: `Task verification rejected`,
      entityType: 'task',
      entityId: verification.taskId,
      notification: {
        userId: submitterUserId,
        title: 'Task Rejected — Revision Required',
        message: revisionNotes
          ? `${comment}\n\nRevision notes: ${revisionNotes}`
          : comment,
        entityType: 'task',
        entityId: verification.taskId,
        jobName: PROJECT_EVENT.TASK_REJECTED,
      },
    });

    if (task?.assigneeId) {
      const assigneeUserId = await resolveNotificationUserId(context.companyId, task.assigneeId);
      if (assigneeUserId !== submitterUserId) {
        await ProjectEventService.emit(context, {
          activityType: ProjectActivityService.TYPES.TASK_REJECTED,
          activityDescription: `Task "${task.title}" sent back for revision`,
          entityType: 'task',
          entityId: verification.taskId,
          notification: {
            userId: assigneeUserId,
            title: 'Task Sent Back for Revision',
            message: revisionNotes ? `${comment}\n\n${revisionNotes}` : comment,
            entityType: 'task',
            entityId: verification.taskId,
            jobName: PROJECT_EVENT.TASK_REJECTED,
          },
        });
      }
    }

    return updated;
  },

  async requestRevision(context: ProjectActorContext, verificationId: string, revisionNotes: string) {
    const verification = await TaskVerificationRepository.findById(verificationId, { companyId: context.companyId });
    if (!verification) {
      throw new NotFoundError('Verification not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await TaskVerificationRepository.update(
      verificationId,
      {
        status: VERIFICATION_STATUS.REVISION,
        revisionNotes,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await TaskRepository.update(
      verification.taskId,
      { status: PROJECT_TASK_STATUS.IN_PROGRESS, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    return updated;
  },

  async listByTask(companyId: string, taskId: string) {
    const verifications = await TaskVerificationRepository.findMany({ taskId }, { companyId });
    return verifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
};
