import {
  ApprovalWorkflowRepository,
  type ApprovalWorkflowDocument,
  type ApprovalWorkflowStageDefinition,
} from '@domain/approval/approval.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ApprovalValidationService } from '@modules/approval/services/approval-validation.service.js';
import { ApprovalAuditService } from '@modules/approval/services/approval-audit.service.js';
import type { ApprovalActorContext } from '@modules/approval/types/approval.types.js';

export const ApprovalWorkflowService = {
  async list(companyId: string, requestType?: string): Promise<ApprovalWorkflowDocument[]> {
    const filter = requestType ? { requestType } : {};
    return ApprovalWorkflowRepository.findMany(filter, { companyId });
  },

  async getById(companyId: string, id: string): Promise<ApprovalWorkflowDocument> {
    const workflow = await ApprovalWorkflowRepository.findById(id, { companyId });
    if (!workflow) {
      throw new NotFoundError('Approval workflow not found', ERROR_CODES.NOT_FOUND);
    }
    return workflow;
  },

  async getBySlug(companyId: string, slug: string): Promise<ApprovalWorkflowDocument> {
    const workflow = await ApprovalWorkflowRepository.findOne({ slug, status: ENTITY_STATUS.ACTIVE }, { companyId });
    if (!workflow) {
      throw new NotFoundError('Approval workflow not found', ERROR_CODES.NOT_FOUND);
    }
    return workflow;
  },

  async getDefaultForRequestType(companyId: string, requestType: string): Promise<ApprovalWorkflowDocument> {
    const workflow = await ApprovalWorkflowRepository.findOne(
      { requestType, isDefault: true, status: ENTITY_STATUS.ACTIVE },
      { companyId },
    );
    if (!workflow) {
      throw new NotFoundError(`No default workflow for request type: ${requestType}`, ERROR_CODES.NOT_FOUND);
    }
    return workflow;
  },

  async create(
    context: ApprovalActorContext,
    payload: {
      name: string;
      slug: string;
      requestType: string;
      description?: string;
      stages: ApprovalWorkflowStageDefinition[];
      isDefault?: boolean;
    },
  ): Promise<ApprovalWorkflowDocument> {
    const existing = await ApprovalWorkflowRepository.findOne({ slug: payload.slug }, { companyId: context.companyId });
    if (existing) {
      throw new ConflictError('Workflow slug already exists', ERROR_CODES.CONFLICT);
    }

    const draft = { ...payload, stages: payload.stages.sort((a, b) => a.order - b.order) } as ApprovalWorkflowDocument;
    ApprovalValidationService.assertValidWorkflow(draft);

    if (payload.isDefault) {
      const defaults = await ApprovalWorkflowRepository.findMany(
        { requestType: payload.requestType, isDefault: true },
        { companyId: context.companyId },
      );
      for (const item of defaults) {
        await ApprovalWorkflowRepository.update(item.id, { isDefault: false, updatedBy: context.userId }, { companyId: context.companyId });
      }
    }

    const id = generateUuid();
    const workflow = await ApprovalWorkflowRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        slug: payload.slug,
        requestType: payload.requestType,
        description: payload.description,
        stages: payload.stages.sort((a, b) => a.order - b.order),
        isDefault: payload.isDefault ?? false,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ApprovalAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'approval_workflow',
      entityId: id,
      action: 'create',
      after: ApprovalAuditService.toRecord(workflow),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return workflow;
  },

  async update(
    context: ApprovalActorContext,
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      stages: ApprovalWorkflowStageDefinition[];
      isDefault: boolean;
      status: string;
    }>,
  ): Promise<ApprovalWorkflowDocument> {
    const before = await this.getById(context.companyId, id);
    if (payload.stages) {
      ApprovalValidationService.assertValidWorkflow({ ...before, stages: payload.stages });
    }

    const updated = await ApprovalWorkflowRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Approval workflow not found', ERROR_CODES.NOT_FOUND);
    }

    await ApprovalAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'approval_workflow',
      entityId: id,
      action: 'update',
      before: ApprovalAuditService.toRecord(before),
      after: ApprovalAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
