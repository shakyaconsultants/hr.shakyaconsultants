import nodemailer, { type Transporter } from 'nodemailer';
import { getEnv } from '@config/env.js';
import type { EmailTemplateType } from '@shared/constants/email.constants.js';
import type { EmailJobPayload } from '@shared/types/api.types.js';
import { ExternalServiceError } from '@shared/errors/app.error.js';
import { toUserFacingErrorMessage } from '@shared/utils/user-facing-error.util.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { queueLogger } from '@logging/winston.logger.js';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateType?: EmailTemplateType;
  correlationId?: string;
  tenantId?: string;
}

interface MailSendResult {
  messageId?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const env = getEnv();
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

export const EmailService = {
  async verifyConnection(): Promise<boolean> {
    try {
      await getTransporter().verify();
      return true;
    } catch {
      return false;
    }
  },

  async send(input: SendEmailInput): Promise<{ messageId: string }> {
    const env = getEnv();
    const correlationId = input.correlationId ?? getCorrelationId() ?? 'system';

    try {
      const result = (await getTransporter().sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers: {
          'X-Correlation-Id': correlationId,
          ...(input.tenantId ? { 'X-Tenant-Id': input.tenantId } : {}),
        },
      })) as MailSendResult;
      const messageId = result.messageId ?? '';
      queueLogger.info('Email sent', {
        messageId,
        to: input.to,
        templateType: input.templateType,
        correlationId,
      });
      return { messageId };
    } catch (error) {
      const message = toUserFacingErrorMessage(
        error,
        'Email could not be sent. The mail server is unreachable. Check SMTP configuration.',
      );
      throw new ExternalServiceError(message, { service: 'smtp', to: input.to }, correlationId);
    }
  },

  buildJobPayload(
    templateType: EmailTemplateType,
    to: string,
    subject: string,
    data: Record<string, unknown>,
    correlationId: string,
    tenantId?: string,
  ): EmailJobPayload {
    return { templateType, to, subject, data, correlationId, tenantId };
  },
};
