import {
  JOB_STATUS,
  SCHEDULED_JOB_TYPE,
  ScheduledJobRepository,
  INTEGRATION_LOG_CATEGORY,
  type ScheduledJobDocument,
} from '@domain/integration/integration.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import { SCHEDULER_QUEUE_JOB } from '@modules/integration/constants/integration.constants.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface ScheduledJobInput {
  name: string;
  cronExpression: string;
  jobType: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export const SchedulerPlatformService = {
  async list(companyId: string, query: { page?: number; pageSize?: number; enabled?: boolean }): Promise<PaginatedResult<ScheduledJobDocument>> {
    const filter: Record<string, unknown> = {};
    if (query.enabled !== undefined) filter.enabled = query.enabled;
    return ScheduledJobRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async create(context: IntegrationActorContext, input: ScheduledJobInput): Promise<ScheduledJobDocument> {
    const doc = await ScheduledJobRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      name: input.name,
      cronExpression: input.cronExpression,
      jobType: input.jobType,
      enabled: input.enabled ?? true,
      config: input.config ?? {},
      lastStatus: JOB_STATUS.PENDING,
      nextRunAt: this.computeNextRun(input.cronExpression),
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'scheduled_job',
      entityId: doc.id,
      action: 'create',
      after: IntegrationAuditService.toRecord(doc),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return doc;
  },

  async update(context: IntegrationActorContext, id: string, input: Partial<ScheduledJobInput>): Promise<ScheduledJobDocument> {
    const before = await ScheduledJobRepository.findByIdOrFail(id, { companyId: context.companyId });
    const update: Record<string, unknown> = { updatedBy: context.userId };
    if (input.name !== undefined) update.name = input.name;
    if (input.cronExpression !== undefined) {
      update.cronExpression = input.cronExpression;
      update.nextRunAt = this.computeNextRun(input.cronExpression);
    }
    if (input.jobType !== undefined) update.jobType = input.jobType;
    if (input.enabled !== undefined) update.enabled = input.enabled;
    if (input.config !== undefined) update.config = input.config;

    const updated = await ScheduledJobRepository.update(id, { $set: update }, { companyId: context.companyId });
    if (!updated) throw new NotFoundError('Scheduled job not found', ERROR_CODES.NOT_FOUND);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'scheduled_job',
      entityId: id,
      action: 'update',
      before: IntegrationAuditService.toRecord(before),
      after: IntegrationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  computeNextRun(_cronExpression: string): Date {
    return new Date(Date.now() + 60 * 60 * 1000);
  },

  async runNow(context: IntegrationActorContext, id: string): Promise<{ jobId: string; queueJobId?: string }> {
    const job = await ScheduledJobRepository.findByIdOrFail(id, { companyId: context.companyId });

    const queueJobId = await QueueProducer.addSchedulerJob(SCHEDULER_QUEUE_JOB.RUN, {
      tenantId: context.companyId,
      userId: context.userId,
      scheduledJobId: job.id,
      jobType: job.jobType,
      config: job.config ?? {},
    });

    await ScheduledJobRepository.update(id, {
      $set: {
        lastRunAt: new Date(),
        lastStatus: JOB_STATUS.PROCESSING,
        nextRunAt: this.computeNextRun(job.cronExpression),
        updatedBy: context.userId,
      },
    }, { companyId: context.companyId });

    await IntegrationLogService.log({
      companyId: context.companyId,
      userId: context.userId,
      category: INTEGRATION_LOG_CATEGORY.SCHEDULER,
      message: `Scheduled job triggered: ${job.name}`,
      metadata: { scheduledJobId: job.id, queueJobId },
    });

    return { jobId: job.id, queueJobId };
  },

  async getHistory(companyId: string, query: { page?: number; pageSize?: number }): Promise<PaginatedResult<ScheduledJobDocument>> {
    return ScheduledJobRepository.paginate({}, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'lastRunAt',
      sortOrder: 'desc',
    });
  },

  jobTypes(): string[] {
    return Object.values(SCHEDULED_JOB_TYPE);
  },
};
