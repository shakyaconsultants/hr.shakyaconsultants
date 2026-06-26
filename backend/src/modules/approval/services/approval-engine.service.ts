import {
  APPROVAL_ACTION_TYPE,
  APPROVAL_REQUEST_STATUS,
  ApprovalActionRepository,
  ApprovalRequestRepository,
  ApprovalTimelineRepository,
  type ApprovalRequestDocument,
  type ApprovalWorkflowStageDefinition,
} from '@domain/approval/approval.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ApprovalWorkflowService } from '@modules/approval/services/approval-workflow.service.js';
import { ApprovalResolverService } from '@modules/approval/services/approval-resolver.service.js';
import { ApprovalValidationService } from '@modules/approval/services/approval-validation.service.js';
import { ApprovalAuditService } from '@modules/approval/services/approval-audit.service.js';
import { ApprovalEventService, APPROVAL_NOTIFICATION_JOB } from '@modules/approval/services/approval-event.service.js';
import { ApprovalEntitySyncService } from '@modules/approval/services/approval-entity-sync.service.js';
import type { ApprovalActorContext, ApprovalListQuery } from '@modules/approval/types/approval.types.js';

function sortedStages(stages: ApprovalWorkflowStageDefinition[]): ApprovalWorkflowStageDefinition[] {
  return [...stages].sort((a, b) => a.order - b.order);
}

function resolveCurrentStage(
  stages: ApprovalWorkflowStageDefinition[],
  currentStageIndex: number,
  currentStageSlug?: string,
): ApprovalWorkflowStageDefinition {
  const byIndex = stages.at(currentStageIndex);
  if (byIndex !== undefined) {
    return byIndex;
  }
  if (currentStageSlug !== undefined && currentStageSlug.length > 0) {
    const bySlug = stages.find((s) => s.slug === currentStageSlug);
    if (bySlug !== undefined) {
      return bySlug;
    }
  }
  throw new ConflictError('Invalid workflow stage', ERROR_CODES.CONFLICT);
}

async function recordTimeline(
  context: ApprovalActorContext,
  approvalRequestId: string,
  eventType: string,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await ApprovalTimelineRepository.create(
    {
      id: generateUuid(),
      companyId: context.companyId,
      approvalRequestId,
      eventType,
      title,
      description,
      actorUserId: context.userId,
      actorEmployeeId: context.employeeId,
      metadata: metadata ?? {},
      occurredAt: new Date(),
      createdBy: context.userId,
      updatedBy: context.userId,
    },
    { companyId: context.companyId },
  );
}

async function recordAction(
  context: ApprovalActorContext,
  input: {
    approvalRequestId: string;
    action: string;
    stageSlug?: string;
    stageOrder?: number;
    comments?: string;
    delegatedToEmployeeId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await ApprovalActionRepository.create(
    {
      id: generateUuid(),
      companyId: context.companyId,
      approvalRequestId: input.approvalRequestId,
      stageSlug: input.stageSlug,
      stageOrder: input.stageOrder,
      actorEmployeeId: context.employeeId,
      actorUserId: context.userId,
      action: input.action,
      comments: input.comments,
      delegatedToEmployeeId: input.delegatedToEmployeeId,
      metadata: input.metadata ?? {},
      createdBy: context.userId,
      updatedBy: context.userId,
    },
    { companyId: context.companyId },
  );
}

async function setStageApprovers(
  context: ApprovalActorContext,
  request: ApprovalRequestDocument,
  stage: ApprovalWorkflowStageDefinition,
): Promise<ApprovalRequestDocument> {
  const approvers = await ApprovalResolverService.resolveForStage(
    context.companyId,
    stage,
    request.requesterEmployeeId,
  );

  const employeeIds = approvers.map((a) => a.employeeId);
  const userIds = approvers.map((a) => a.userId).filter((id): id is string => Boolean(id));

  const slaDueAt = stage.slaHours
    ? new Date(Date.now() + stage.slaHours * 60 * 60 * 1000)
    : undefined;

  const updated = await ApprovalRequestRepository.update(
    request.id,
    {
      currentStageIndex: stage.order - 1,
      currentStageSlug: stage.slug,
      status: APPROVAL_REQUEST_STATUS.IN_PROGRESS,
      pendingApproverEmployeeIds: employeeIds,
      pendingApproverUserIds: userIds,
      slaDueAt,
      updatedBy: context.userId,
    },
    { companyId: context.companyId },
  );

  if (!updated) {
    throw new NotFoundError('Approval request not found', ERROR_CODES.NOT_FOUND);
  }

  for (const approver of approvers) {
    if (approver.userId) {
      await ApprovalEventService.notify(context, {
        recipientUserId: approver.userId,
        title: `Approval pending: ${request.title}`,
        body: request.description ?? 'A new approval requires your action.',
        entityType: request.entityType,
        entityId: request.entityId,
        deepLink: `/leave-exit/approvals/${request.id}`,
        jobName: APPROVAL_NOTIFICATION_JOB.PENDING,
      });
    }
  }

  return updated;
}

export const ApprovalEngineService = {
  async getById(companyId: string, id: string): Promise<ApprovalRequestDocument> {
    const request = await ApprovalRequestRepository.findById(id, { companyId });
    if (!request) {
      throw new NotFoundError('Approval request not found', ERROR_CODES.NOT_FOUND);
    }
    return request;
  },

  async createRequest(
    context: ApprovalActorContext,
    input: {
      requestType: string;
      entityType: string;
      entityId: string;
      workflowSlug?: string;
      workflowId?: string;
      requesterEmployeeId: string;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<ApprovalRequestDocument> {
    const workflow = input.workflowId
      ? await ApprovalWorkflowService.getById(context.companyId, input.workflowId)
      : input.workflowSlug
        ? await ApprovalWorkflowService.getBySlug(context.companyId, input.workflowSlug)
        : await ApprovalWorkflowService.getDefaultForRequestType(context.companyId, input.requestType);

    ApprovalValidationService.assertValidWorkflow(workflow);

    const id = generateUuid();
    const request = await ApprovalRequestRepository.create(
      {
        id,
        companyId: context.companyId,
        requestType: input.requestType,
        entityType: input.entityType,
        entityId: input.entityId,
        workflowId: workflow.id,
        workflowSlug: workflow.slug,
        requesterEmployeeId: input.requesterEmployeeId,
        requesterUserId: context.userId,
        title: input.title,
        description: input.description,
        currentStageIndex: -1,
        status: APPROVAL_REQUEST_STATUS.DRAFT,
        metadata: input.metadata ?? {},
        pendingApproverEmployeeIds: [],
        pendingApproverUserIds: [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await recordTimeline(context, id, 'created', 'Approval request created');
    await ApprovalAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'approval_request',
      entityId: id,
      action: 'create',
      after: ApprovalAuditService.toRecord(request),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return request;
  },

  async submitRequest(context: ApprovalActorContext, requestId: string): Promise<ApprovalRequestDocument> {
    const request = await this.getById(context.companyId, requestId);
    if (request.status !== APPROVAL_REQUEST_STATUS.DRAFT) {
      throw new ConflictError('Only draft requests can be submitted', ERROR_CODES.CONFLICT);
    }

    const workflow = await ApprovalWorkflowService.getById(context.companyId, request.workflowId);
    ApprovalValidationService.assertValidWorkflow(workflow);
    const stages = sortedStages(workflow.stages);
    const firstStage = stages[0];

    await ApprovalRequestRepository.update(
      requestId,
      { status: APPROVAL_REQUEST_STATUS.PENDING, submittedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await recordAction(context, { approvalRequestId: requestId, action: APPROVAL_ACTION_TYPE.SUBMIT });
    await recordTimeline(context, requestId, 'submitted', 'Request submitted for approval');

    const updated = await this.getById(context.companyId, requestId);
    return setStageApprovers(context, updated, firstStage);
  },

  async approve(context: ApprovalActorContext, requestId: string, comments?: string): Promise<ApprovalRequestDocument> {
    const request = await this.getById(context.companyId, requestId);
    if (![APPROVAL_REQUEST_STATUS.PENDING, APPROVAL_REQUEST_STATUS.IN_PROGRESS, APPROVAL_REQUEST_STATUS.ESCALATED].includes(request.status as typeof APPROVAL_REQUEST_STATUS.PENDING)) {
      throw new ConflictError('Request is not pending approval', ERROR_CODES.CONFLICT);
    }

    const workflow = await ApprovalWorkflowService.getById(context.companyId, request.workflowId);
    const stages = sortedStages(workflow.stages);
    const currentStage = resolveCurrentStage(stages, request.currentStageIndex, request.currentStageSlug);

    ApprovalValidationService.assertIsPendingApprover(context.employeeId, request.pendingApproverEmployeeIds);
    ApprovalValidationService.assertNotSelfApproval(context.employeeId, request.requesterEmployeeId, currentStage);

    const priorActions = await ApprovalActionRepository.findMany({ approvalRequestId: requestId }, { companyId: context.companyId });
    ApprovalValidationService.assertNoDuplicateAction(priorActions, context.userId, currentStage.slug);

    await recordAction(context, {
      approvalRequestId: requestId,
      action: APPROVAL_ACTION_TYPE.APPROVE,
      stageSlug: currentStage.slug,
      stageOrder: currentStage.order,
      comments,
    });
    await recordTimeline(context, requestId, 'approved', `Approved at ${currentStage.name}`, comments);

    const nextStage = stages.find((s) => s.order > currentStage.order);
    if (nextStage) {
      const advanced = await setStageApprovers(context, request, nextStage);
      await ApprovalAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'approval_request',
        entityId: requestId,
        action: 'approve',
        after: { stage: currentStage.slug, nextStage: nextStage.slug },
        ip: context.ip,
        userAgent: context.userAgent,
      });
      return advanced;
    }

    const completed = await ApprovalRequestRepository.update(
      requestId,
      {
        status: APPROVAL_REQUEST_STATUS.APPROVED,
        pendingApproverEmployeeIds: [],
        pendingApproverUserIds: [],
        completedAt: new Date(),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (!completed) {
      throw new NotFoundError('Approval request not found', ERROR_CODES.NOT_FOUND);
    }

    await ApprovalEventService.notify(context, {
      recipientUserId: request.requesterUserId,
      title: `Approved: ${request.title}`,
      body: comments ?? 'Your request has been fully approved.',
      entityType: request.entityType,
      entityId: request.entityId,
      jobName: APPROVAL_NOTIFICATION_JOB.APPROVED,
    });

    await ApprovalEntitySyncService.syncOnDecision(context, completed);
    await ApprovalAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'approval_request',
      entityId: requestId,
      action: 'approve',
      after: ApprovalAuditService.toRecord(completed),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return completed;
  },

  async reject(context: ApprovalActorContext, requestId: string, comments?: string): Promise<ApprovalRequestDocument> {
    const request = await this.getById(context.companyId, requestId);
    ApprovalValidationService.assertIsPendingApprover(context.employeeId, request.pendingApproverEmployeeIds);

    await recordAction(context, {
      approvalRequestId: requestId,
      action: APPROVAL_ACTION_TYPE.REJECT,
      stageSlug: request.currentStageSlug,
      stageOrder: request.currentStageIndex + 1,
      comments,
    });

    const rejected = await ApprovalRequestRepository.update(
      requestId,
      {
        status: APPROVAL_REQUEST_STATUS.REJECTED,
        pendingApproverEmployeeIds: [],
        pendingApproverUserIds: [],
        completedAt: new Date(),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (!rejected) {
      throw new NotFoundError('Approval request not found', ERROR_CODES.NOT_FOUND);
    }

    await recordTimeline(context, requestId, 'rejected', 'Request rejected', comments);
    await ApprovalEventService.notify(context, {
      recipientUserId: request.requesterUserId,
      title: `Rejected: ${request.title}`,
      body: comments ?? 'Your request was rejected.',
      entityType: request.entityType,
      entityId: request.entityId,
      jobName: APPROVAL_NOTIFICATION_JOB.REJECTED,
    });

    await ApprovalEntitySyncService.syncOnDecision(context, rejected);
    await ApprovalAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'approval_request',
      entityId: requestId,
      action: 'reject',
      after: ApprovalAuditService.toRecord(rejected),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return rejected;
  },

  async withdraw(context: ApprovalActorContext, requestId: string, comments?: string): Promise<ApprovalRequestDocument> {
    const request = await this.getById(context.companyId, requestId);
    if (request.requesterEmployeeId !== context.employeeId) {
      throw new ConflictError('Only the requester can withdraw', ERROR_CODES.CONFLICT);
    }

    await recordAction(context, { approvalRequestId: requestId, action: APPROVAL_ACTION_TYPE.WITHDRAW, comments });

    const withdrawn = await ApprovalRequestRepository.update(
      requestId,
      {
        status: APPROVAL_REQUEST_STATUS.WITHDRAWN,
        pendingApproverEmployeeIds: [],
        pendingApproverUserIds: [],
        completedAt: new Date(),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (!withdrawn) {
      throw new NotFoundError('Approval request not found', ERROR_CODES.NOT_FOUND);
    }

    await ApprovalEntitySyncService.syncOnDecision(context, withdrawn);
    return withdrawn;
  },

  async escalate(context: ApprovalActorContext, requestId: string, comments?: string): Promise<ApprovalRequestDocument> {
    const request = await this.getById(context.companyId, requestId);

    await recordAction(context, { approvalRequestId: requestId, action: APPROVAL_ACTION_TYPE.ESCALATE, comments });

    const escalated = await ApprovalRequestRepository.update(
      requestId,
      { status: APPROVAL_REQUEST_STATUS.ESCALATED, escalatedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    if (!escalated) {
      throw new NotFoundError('Approval request not found', ERROR_CODES.NOT_FOUND);
    }

    for (const userId of escalated.pendingApproverUserIds) {
      await ApprovalEventService.notify(context, {
        recipientUserId: userId,
        title: `Escalated: ${request.title}`,
        body: comments ?? 'Approval request has been escalated.',
        entityType: request.entityType,
        entityId: request.entityId,
        jobName: APPROVAL_NOTIFICATION_JOB.ESCALATED,
      });
    }

    await ApprovalAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'approval_request',
      entityId: requestId,
      action: 'escalate',
      after: ApprovalAuditService.toRecord(escalated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return escalated;
  },

  async addComment(context: ApprovalActorContext, requestId: string, comments: string): Promise<void> {
    await this.getById(context.companyId, requestId);
    await recordAction(context, { approvalRequestId: requestId, action: APPROVAL_ACTION_TYPE.COMMENT, comments });
    await recordTimeline(context, requestId, 'comment', 'Comment added', comments);
  },

  async bulkApprove(context: ApprovalActorContext, requestIds: string[], comments?: string): Promise<{ approved: number; failed: string[] }> {
    let approved = 0;
    const failed: string[] = [];
    for (const id of requestIds) {
      try {
        await this.approve(context, id, comments);
        approved += 1;
      } catch {
        failed.push(id);
      }
    }
    return { approved, failed };
  },

  async getInbox(context: ApprovalActorContext, query: ApprovalListQuery) {
    if (!context.employeeId) {
      return { items: [], total: 0, page: 1, pageSize: 20 };
    }

    const filter: Record<string, unknown> = {
      pendingApproverEmployeeIds: context.employeeId,
      status: { $in: [APPROVAL_REQUEST_STATUS.PENDING, APPROVAL_REQUEST_STATUS.IN_PROGRESS, APPROVAL_REQUEST_STATUS.ESCALATED] },
    };
    if (query.requestType) {
      filter.requestType = query.requestType;
    }

    return ApprovalRequestRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId: context.companyId });
  },

  async getHistory(companyId: string, requestId: string) {
    const [request, actions, timeline] = await Promise.all([
      this.getById(companyId, requestId),
      ApprovalActionRepository.findMany({ approvalRequestId: requestId }, { companyId }),
      ApprovalTimelineRepository.findMany({ approvalRequestId: requestId }, { companyId }),
    ]);

    return {
      request: ApprovalAuditService.toRecord(request),
      actions: actions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(ApprovalAuditService.toRecord),
      timeline: timeline.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()).map(ApprovalAuditService.toRecord),
    };
  },

  async list(context: ApprovalActorContext, query: ApprovalListQuery) {
    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.requestType) {
      filter.requestType = query.requestType;
    }
    if (query.entityType) {
      filter.entityType = query.entityType;
    }

    return ApprovalRequestRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId: context.companyId });
  },
};
