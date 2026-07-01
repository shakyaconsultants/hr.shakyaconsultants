import type { Job } from 'bullmq';
import { getEnv } from '@config/env.js';
import { EmailService } from '@infrastructure/email/email.service.js';
import { renderEmailFromJobPayload } from '@infrastructure/email/email-template.renderer.js';
import type { QueueJobData } from '@infrastructure/queue/queue.producer.js';
import { queueLogger } from '@logging/winston.logger.js';
import { ExternalServiceError } from '@shared/errors/app.error.js';

export async function deliverEmailPayload(
  data: QueueJobData,
  jobName?: string,
): Promise<void> {
  const payload = data.payload;
  const to = typeof payload.to === 'string' ? payload.to.trim() : '';
  if (!to) {
    throw new Error(`Email job${jobName ? ` (${jobName})` : ''} is missing recipient address`);
  }

  const rendered = renderEmailFromJobPayload(payload);
  const env = getEnv();

  if (env.SMTP_PASSWORD === 'not-configured') {
    const hint = 'Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL in backend/.env';
    if (env.NODE_ENV === 'development') {
      queueLogger.warn('SMTP not configured — activation link logged to console', {
        jobName,
        to,
        activationUrl: payload.activationUrl,
        portalUrl: payload.portalUrl,
        resetUrl: payload.resetUrl,
      });
      console.log('\n--- EMAIL (SMTP not configured) ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${rendered.subject}`);
      if (payload.activationUrl) console.log(`Activation: ${String(payload.activationUrl)}`);
      if (payload.portalUrl) console.log(`Onboarding: ${String(payload.portalUrl)}`);
      if (payload.resetUrl) console.log(`Reset: ${String(payload.resetUrl)}`);
      console.log(`Note: ${hint}`);
      console.log('---\n');
    }
    throw new ExternalServiceError(`Email could not be delivered. ${hint}`, { service: 'smtp', to });
  }

  await EmailService.send({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    templateType: rendered.templateType,
    correlationId: data.correlationId,
    tenantId: data.tenantId,
  });
}

export async function processEmailJob(job: Job<QueueJobData>): Promise<void> {
  queueLogger.info('Processing email job', {
    jobName: job.name,
    jobId: job.id,
    correlationId: job.data.correlationId,
  });
  await deliverEmailPayload(job.data, job.name);
}
