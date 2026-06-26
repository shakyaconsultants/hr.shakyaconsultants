import { EmailService, type SendEmailInput } from '@infrastructure/email/email.service.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import type { EmailTemplateType } from '@shared/constants/email.constants.js';

export const EmailPlatformService = {
  verifyConnection(): Promise<boolean> {
    return EmailService.verifyConnection();
  },

  send(input: SendEmailInput): Promise<{ messageId: string }> {
    return EmailService.send(input);
  },

  queueEmail(
    jobName: string,
    payload: Record<string, unknown>,
  ): Promise<string | undefined> {
    return QueueProducer.addEmailJob(jobName, payload);
  },

  buildJobPayload(
    templateType: EmailTemplateType,
    to: string,
    subject: string,
    data: Record<string, unknown>,
    correlationId: string,
    tenantId?: string,
  ) {
    return EmailService.buildJobPayload(templateType, to, subject, data, correlationId, tenantId);
  },
};
