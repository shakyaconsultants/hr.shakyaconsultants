import { getEnv } from '@config/env.js';
import { EmailService } from '@infrastructure/email/email.service.js';
import { renderEmailFromJobPayload } from '@infrastructure/email/email-template.renderer.js';
import { EmailBrandingService } from '@infrastructure/email/email-branding.service.js';
import { ExternalServiceError } from '@shared/errors/app.error.js';
import { asOptionalUrlString } from '@shared/utils/safe-string.util.js';
import { logger } from '@logging/winston.logger.js';

export interface EmailJobData {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  payload: Record<string, unknown>;
}

export async function deliverEmailPayload(data: EmailJobData, jobName?: string): Promise<void> {
  const payload = data.payload;
  const to = typeof payload.to === 'string' ? payload.to.trim() : '';
  if (!to) {
    throw new Error(`Email job${jobName ? ` (${jobName})` : ''} is missing recipient address`);
  }

  const tenantId =
    data.tenantId ?? (typeof payload.tenantId === 'string' ? payload.tenantId : undefined);
  const branding = tenantId
    ? await EmailBrandingService.getBranding(tenantId)
    : EmailBrandingService.getDefaultBranding();
  const rendered = renderEmailFromJobPayload(payload, branding);
  const env = getEnv();

  if (env.SMTP_PASSWORD === 'not-configured') {
    const hint =
      'Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL in backend/.env';
    if (env.NODE_ENV === 'production') {
      throw new ExternalServiceError(
        `Email could not be sent because SMTP is not configured. ${hint}`,
        { service: 'smtp', to },
        data.correlationId,
      );
    }

    logger.warn('SMTP not configured — email content logged to console', {
      jobName,
      to,
      activationUrl: payload.activationUrl,
      portalUrl: payload.portalUrl,
      resetUrl: payload.resetUrl,
    });
    console.log('\n--- EMAIL (SMTP not configured) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${rendered.subject}`);
    const activationUrl = asOptionalUrlString(payload.activationUrl);
    const portalUrl = asOptionalUrlString(payload.portalUrl);
    const resetUrl = asOptionalUrlString(payload.resetUrl);
    if (activationUrl) console.log(`Activation: ${activationUrl}`);
    if (portalUrl) console.log(`Onboarding: ${portalUrl}`);
    if (resetUrl) console.log(`Reset: ${resetUrl}`);
    console.log(`Note: ${hint}`);
    console.log('---\n');
    return;
  }

  try {
    await EmailService.send({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      templateType: rendered.templateType,
      correlationId: data.correlationId,
      tenantId: data.tenantId,
    });
  } catch (error) {
    logger.error('Email delivery failed — link logged for manual follow-up', {
      jobName,
      to,
      activationUrl: payload.activationUrl,
      portalUrl: payload.portalUrl,
      resetUrl: payload.resetUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    if (payload.activationUrl || payload.portalUrl || payload.resetUrl) {
      console.log('\n--- EMAIL DELIVERY FAILED (manual link) ---');
      console.log(`To: ${to}`);
      const failedActivationUrl = asOptionalUrlString(payload.activationUrl);
      const failedPortalUrl = asOptionalUrlString(payload.portalUrl);
      const failedResetUrl = asOptionalUrlString(payload.resetUrl);
      if (failedActivationUrl) console.log(`Activation: ${failedActivationUrl}`);
      if (failedPortalUrl) console.log(`Onboarding: ${failedPortalUrl}`);
      if (failedResetUrl) console.log(`Reset: ${failedResetUrl}`);
      console.log('---\n');
    }
    throw error;
  }
}
