import { WebhookPlatformService } from '@modules/integration/services/webhook-platform.service.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { INTEGRATION_LOG_CATEGORY } from '@domain/integration/integration.schemas.js';

export const IntegrationEventService = {
  async publishIntegrationEvent(
    companyId: string,
    event: string,
    payload: Record<string, unknown>,
    userId = 'system',
  ): Promise<void> {
    await WebhookPlatformService.publish(companyId, event, payload, userId);

    await IntegrationLogService.log({
      companyId,
      userId,
      category: INTEGRATION_LOG_CATEGORY.WEBHOOK,
      message: `Integration event published: ${event}`,
      metadata: { event, payloadKeys: Object.keys(payload) },
    });
  },
};
