import { createHmac, randomBytes } from 'node:crypto';
import {
  WEBHOOK_DELIVERY_STATUS,
  WebhookDeliveryRepository,
  WebhookSubscriptionRepository,
  INTEGRATION_LOG_CATEGORY,
  type WebhookDeliveryDocument,
  type WebhookSubscriptionDocument,
} from '@domain/integration/integration.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import { WEBHOOK_QUEUE_JOB } from '@modules/integration/constants/integration.constants.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface WebhookInput {
  url: string;
  events: string[];
  enabled?: boolean;
  retryPolicy?: { maxAttempts?: number; backoffMs?: number };
}

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export const WebhookPlatformService = {
  async list(companyId: string, query: { page?: number; pageSize?: number }): Promise<PaginatedResult<WebhookSubscriptionDocument>> {
    return WebhookSubscriptionRepository.paginate({}, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async getById(companyId: string, id: string): Promise<WebhookSubscriptionDocument> {
    return WebhookSubscriptionRepository.findByIdOrFail(id, { companyId });
  },

  async create(context: IntegrationActorContext, input: WebhookInput): Promise<{ subscription: WebhookSubscriptionDocument; secret: string }> {
    const secret = generateSecret();
    const doc = await WebhookSubscriptionRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      url: input.url,
      secret,
      events: input.events,
      enabled: input.enabled ?? true,
      retryPolicy: {
        maxAttempts: input.retryPolicy?.maxAttempts ?? 3,
        backoffMs: input.retryPolicy?.backoffMs ?? 5000,
      },
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'webhook_subscription',
      entityId: doc.id,
      action: 'create',
      after: { ...IntegrationAuditService.toRecord(doc), secret: '[REDACTED]' },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { subscription: doc, secret };
  },

  async update(context: IntegrationActorContext, id: string, input: Partial<WebhookInput>): Promise<WebhookSubscriptionDocument> {
    const before = await WebhookSubscriptionRepository.findByIdOrFail(id, { companyId: context.companyId });
    const update: Record<string, unknown> = { updatedBy: context.userId };
    if (input.url !== undefined) update.url = input.url;
    if (input.events !== undefined) update.events = input.events;
    if (input.enabled !== undefined) update.enabled = input.enabled;
    if (input.retryPolicy !== undefined) {
      update.retryPolicy = {
        maxAttempts: input.retryPolicy.maxAttempts ?? before.retryPolicy.maxAttempts,
        backoffMs: input.retryPolicy.backoffMs ?? before.retryPolicy.backoffMs,
      };
    }

    const updated = await WebhookSubscriptionRepository.update(id, { $set: update }, { companyId: context.companyId });
    if (!updated) throw new NotFoundError('Webhook not found', ERROR_CODES.NOT_FOUND);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'webhook_subscription',
      entityId: id,
      action: 'update',
      before: IntegrationAuditService.toRecord(before),
      after: IntegrationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: IntegrationActorContext, id: string): Promise<void> {
    const before = await WebhookSubscriptionRepository.findByIdOrFail(id, { companyId: context.companyId });
    await WebhookSubscriptionRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'webhook_subscription',
      entityId: id,
      action: 'delete',
      before: IntegrationAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async publish(companyId: string, event: string, payload: Record<string, unknown>, userId = 'system'): Promise<void> {
    const subscriptions = await WebhookSubscriptionRepository.findMany(
      { enabled: true, events: event },
      { companyId },
    );

    for (const sub of subscriptions) {
      await this.enqueueDelivery(companyId, sub.id, event, payload, userId);
    }
  },

  async enqueueDelivery(
    companyId: string,
    subscriptionId: string,
    event: string,
    payload: Record<string, unknown>,
    userId: string,
  ): Promise<WebhookDeliveryDocument> {
    const delivery = await WebhookDeliveryRepository.create({
      id: generateUuid(),
      companyId,
      subscriptionId,
      event,
      payload,
      status: WEBHOOK_DELIVERY_STATUS.PENDING,
      attempts: 0,
      createdBy: userId,
      updatedBy: userId,
    });

    await QueueProducer.addWebhookJob(WEBHOOK_QUEUE_JOB.DELIVER, {
      tenantId: companyId,
      userId,
      deliveryId: delivery.id,
      subscriptionId,
      event,
    });

    return delivery;
  },

  async deliver(companyId: string, deliveryId: string): Promise<WebhookDeliveryDocument> {
    const delivery = await WebhookDeliveryRepository.findByIdOrFail(deliveryId, { companyId });
    const subscription = await WebhookSubscriptionRepository.findByIdOrFail(delivery.subscriptionId, { companyId });

    const body = JSON.stringify({ event: delivery.event, payload: delivery.payload, timestamp: new Date().toISOString() });
    const signature = signPayload(subscription.secret, body);

    let responseCode: number | undefined;
    let error: string | undefined;
    let status: string = WEBHOOK_DELIVERY_STATUS.DELIVERED;

    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
        },
        body,
      });
      responseCode = response.status;
      if (!response.ok) {
        status = WEBHOOK_DELIVERY_STATUS.FAILED;
        error = `HTTP ${response.status}`;
      }
    } catch (err) {
      status = WEBHOOK_DELIVERY_STATUS.FAILED;
      error = err instanceof Error ? err.message : 'Delivery failed';
    }

    const attempts = delivery.attempts + 1;
    const updated = await WebhookDeliveryRepository.update(deliveryId, {
      $set: {
        status,
        attempts,
        responseCode,
        error,
        updatedBy: delivery.createdBy,
      },
    }, { companyId });

    if (status === WEBHOOK_DELIVERY_STATUS.FAILED && attempts < subscription.retryPolicy.maxAttempts) {
      await QueueProducer.addWebhookJob(WEBHOOK_QUEUE_JOB.RETRY, {
        tenantId: companyId,
        deliveryId,
        subscriptionId: subscription.id,
        attempt: attempts,
      }, { delay: subscription.retryPolicy.backoffMs * attempts });
    }

    await IntegrationLogService.log({
      companyId,
      userId: delivery.createdBy,
      category: INTEGRATION_LOG_CATEGORY.WEBHOOK,
      message: `Webhook delivery ${status}: ${delivery.event}`,
      metadata: { deliveryId, subscriptionId: subscription.id, responseCode, error },
    });

    return updated ?? delivery;
  },

  async listDeliveries(companyId: string, subscriptionId: string, query: { page?: number; pageSize?: number }): Promise<PaginatedResult<WebhookDeliveryDocument>> {
    return WebhookDeliveryRepository.paginate({ subscriptionId }, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async test(context: IntegrationActorContext, id: string): Promise<{ success: boolean; message: string }> {
    const subscription = await WebhookSubscriptionRepository.findByIdOrFail(id, { companyId: context.companyId });
    const delivery = await this.enqueueDelivery(
      context.companyId,
      subscription.id,
      'TestEvent',
      { message: 'Test webhook delivery from HR Shakya' },
      context.userId,
    );
    const result = await this.deliver(context.companyId, delivery.id);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'webhook_subscription',
      entityId: id,
      action: 'test',
      after: { deliveryId: delivery.id, status: result.status },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return {
      success: result.status === WEBHOOK_DELIVERY_STATUS.DELIVERED,
      message: result.error ?? 'Test delivery completed',
    };
  },
};
