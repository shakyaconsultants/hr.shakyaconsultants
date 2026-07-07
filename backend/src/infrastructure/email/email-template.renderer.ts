import { EMAIL_TEMPLATE_TYPES, type EmailTemplateType } from '@shared/constants/email.constants.js';
import type { CompanyEmailBranding } from '@infrastructure/email/email-branding.service.js';
import { renderCompanyEmail } from '@infrastructure/email/company-email-layout.js';
import { asPrimitiveString } from '@shared/utils/safe-string.util.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text?: string;
  templateType: EmailTemplateType;
}

function formatExpiry(expiresAt: string | undefined): string {
  if (!expiresAt) {
    return '48 hours';
  }
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return '48 hours';
  }
  return date.toLocaleString();
}

function renderAccountActivation(
  payload: Record<string, unknown>,
  branding: CompanyEmailBranding,
): RenderedEmail {
  const activationUrl = asPrimitiveString(payload.activationUrl);
  const expiresAt = formatExpiry(
    typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
  );
  const bodyHtml = `<p>Your employee account has been created at <strong>${branding.companyName}</strong>. Activate your account and set a secure password using the button below.</p><p>This link expires on <strong>${expiresAt}</strong>.</p><p style="word-break:break-all;color:#64748b;font-size:13px;">${activationUrl}</p>`;
  const rendered = renderCompanyEmail({
    branding,
    title: 'Activate your account',
    greeting: 'Welcome aboard,',
    previewText: `Activate your ${branding.companyName} account`,
    bodyHtml,
    cta: { label: 'Activate account', url: activationUrl },
  });
  return {
    subject: `Activate your ${branding.companyName} account`,
    html: rendered.html,
    text: rendered.text,
    templateType: EMAIL_TEMPLATE_TYPES.ACCOUNT_ACTIVATION,
  };
}

function renderOnboardingPortal(
  payload: Record<string, unknown>,
  branding: CompanyEmailBranding,
): RenderedEmail {
  const portalUrl = asPrimitiveString(payload.portalUrl);
  const expiresAt = formatExpiry(
    typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
  );
  const bodyHtml = `<p>Please complete your employee onboarding profile for <strong>${branding.companyName}</strong>.</p><p>This secure link expires on <strong>${expiresAt}</strong>.</p><p style="word-break:break-all;color:#64748b;font-size:13px;">${portalUrl}</p>`;
  const rendered = renderCompanyEmail({
    branding,
    title: 'Complete your onboarding',
    greeting: 'Hello,',
    previewText: `Complete onboarding at ${branding.companyName}`,
    bodyHtml,
    cta: { label: 'Complete onboarding', url: portalUrl },
  });
  return {
    subject: `Complete your onboarding — ${branding.companyName}`,
    html: rendered.html,
    text: rendered.text,
    templateType: EMAIL_TEMPLATE_TYPES.ONBOARDING_PORTAL,
  };
}

function renderPasswordReset(
  payload: Record<string, unknown>,
  branding: CompanyEmailBranding,
): RenderedEmail {
  const resetUrl = asPrimitiveString(payload.resetUrl);
  const expiresAt = formatExpiry(
    typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
  );
  const bodyHtml = `<p>We received a request to reset your password for <strong>${branding.companyName}</strong>.</p><p>This link expires on <strong>${expiresAt}</strong>. If you did not request this, you can safely ignore this email.</p><p style="word-break:break-all;color:#64748b;font-size:13px;">${resetUrl}</p>`;
  const rendered = renderCompanyEmail({
    branding,
    title: 'Reset your password',
    greeting: 'Hello,',
    previewText: `Password reset for ${branding.companyName}`,
    bodyHtml,
    cta: { label: 'Reset password', url: resetUrl },
  });
  return {
    subject: `Reset your password — ${branding.companyName}`,
    html: rendered.html,
    text: rendered.text,
    templateType: EMAIL_TEMPLATE_TYPES.PASSWORD_RESET,
  };
}

function renderFromBuildJobPayload(payload: Record<string, unknown>): RenderedEmail | null {
  const subject = typeof payload.subject === 'string' ? payload.subject : '';
  const data =
    typeof payload.data === 'object' && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : null;
  const html = data && typeof data.html === 'string' ? data.html : '';
  if (!subject || !html) {
    return null;
  }
  const templateType = (
    typeof payload.templateType === 'string'
      ? payload.templateType
      : EMAIL_TEMPLATE_TYPES.NOTIFICATION
  ) as EmailTemplateType;
  const text = data && typeof data.text === 'string' ? data.text : undefined;
  return { subject, html, text, templateType };
}

export function renderEmailFromJobPayload(
  payload: Record<string, unknown>,
  branding: CompanyEmailBranding,
): RenderedEmail {
  const templateType = typeof payload.templateType === 'string' ? payload.templateType : '';

  if (templateType === EMAIL_TEMPLATE_TYPES.ACCOUNT_ACTIVATION) {
    return renderAccountActivation(payload, branding);
  }
  if (templateType === EMAIL_TEMPLATE_TYPES.ONBOARDING_PORTAL) {
    return renderOnboardingPortal(payload, branding);
  }
  if (templateType === EMAIL_TEMPLATE_TYPES.PASSWORD_RESET) {
    return renderPasswordReset(payload, branding);
  }

  const built = renderFromBuildJobPayload(payload);
  if (built) {
    return built;
  }

  const subject =
    typeof payload.subject === 'string' ? payload.subject : `${branding.companyName} notification`;
  const fallback = renderCompanyEmail({
    branding,
    title: subject,
    greeting: 'Hello,',
    bodyHtml: '<p>You have a new notification from your HR portal.</p>',
  });

  return {
    subject,
    html: typeof payload.html === 'string' ? payload.html : fallback.html,
    text: typeof payload.text === 'string' ? payload.text : fallback.text,
    templateType: (templateType || EMAIL_TEMPLATE_TYPES.NOTIFICATION) as EmailTemplateType,
  };
}
