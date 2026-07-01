import { EMAIL_TEMPLATE_TYPES, type EmailTemplateType } from '@shared/constants/email.constants.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text?: string;
  templateType: EmailTemplateType;
}

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;"><h2>${title}</h2>${body}<hr><p style="font-size:12px;color:#888;">HR Shakya ERP — Automated message. Do not reply to this email.</p></body></html>`;
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

function renderAccountActivation(payload: Record<string, unknown>): RenderedEmail {
  const activationUrl = String(payload.activationUrl ?? '');
  const expiresAt = formatExpiry(typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined);
  const body = `<p>Your employee account has been created. Activate your account and set a password using the secure link below.</p><p style="margin:24px 0;"><a href="${activationUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Activate account</a></p><p>Or copy this link:<br/><span style="word-break:break-all;">${activationUrl}</span></p><p>This link expires on <strong>${expiresAt}</strong>.</p>`;
  return {
    subject: 'Activate your HR Shakya account',
    html: wrapTemplate('Account activation', body),
    text: `Activate your account: ${activationUrl} (expires ${expiresAt})`,
    templateType: EMAIL_TEMPLATE_TYPES.ACCOUNT_ACTIVATION,
  };
}

function renderOnboardingPortal(payload: Record<string, unknown>): RenderedEmail {
  const portalUrl = String(payload.portalUrl ?? '');
  const expiresAt = formatExpiry(typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined);
  const body = `<p>Welcome! Please complete your employee onboarding profile using the secure link below.</p><p style="margin:24px 0;"><a href="${portalUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Complete onboarding</a></p><p>Or copy this link:<br/><span style="word-break:break-all;">${portalUrl}</span></p><p>This link expires on <strong>${expiresAt}</strong>.</p>`;
  return {
    subject: 'Complete your employee onboarding',
    html: wrapTemplate('Employee onboarding', body),
    text: `Complete onboarding: ${portalUrl} (expires ${expiresAt})`,
    templateType: EMAIL_TEMPLATE_TYPES.ONBOARDING_PORTAL,
  };
}

function renderPasswordReset(payload: Record<string, unknown>): RenderedEmail {
  const resetUrl = String(payload.resetUrl ?? '');
  const expiresAt = formatExpiry(typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined);
  const body = `<p>We received a request to reset your password.</p><p style="margin:24px 0;"><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Reset password</a></p><p>Or copy this link:<br/><span style="word-break:break-all;">${resetUrl}</span></p><p>This link expires on <strong>${expiresAt}</strong>. If you did not request this, you can ignore this email.</p>`;
  return {
    subject: 'Reset your HR Shakya password',
    html: wrapTemplate('Password reset', body),
    text: `Reset password: ${resetUrl} (expires ${expiresAt})`,
    templateType: EMAIL_TEMPLATE_TYPES.PASSWORD_RESET,
  };
}

function renderFromBuildJobPayload(payload: Record<string, unknown>): RenderedEmail | null {
  const subject = typeof payload.subject === 'string' ? payload.subject : '';
  const data = typeof payload.data === 'object' && payload.data !== null ? (payload.data as Record<string, unknown>) : null;
  const html = data && typeof data.html === 'string' ? data.html : '';
  if (!subject || !html) {
    return null;
  }
  const templateType = (typeof payload.templateType === 'string'
    ? payload.templateType
    : EMAIL_TEMPLATE_TYPES.NOTIFICATION) as EmailTemplateType;
  const text = data && typeof data.text === 'string' ? data.text : undefined;
  return { subject, html, text, templateType };
}

export function renderEmailFromJobPayload(payload: Record<string, unknown>): RenderedEmail {
  const templateType = typeof payload.templateType === 'string' ? payload.templateType : '';

  if (templateType === EMAIL_TEMPLATE_TYPES.ACCOUNT_ACTIVATION) {
    return renderAccountActivation(payload);
  }
  if (templateType === EMAIL_TEMPLATE_TYPES.ONBOARDING_PORTAL) {
    return renderOnboardingPortal(payload);
  }
  if (templateType === EMAIL_TEMPLATE_TYPES.PASSWORD_RESET) {
    return renderPasswordReset(payload);
  }

  const built = renderFromBuildJobPayload(payload);
  if (built) {
    return built;
  }

  const subject = typeof payload.subject === 'string' ? payload.subject : 'HR Shakya notification';
  const html = typeof payload.html === 'string'
    ? payload.html
    : wrapTemplate(subject, '<p>You have a new notification from HR Shakya ERP.</p>');
  const text = typeof payload.text === 'string' ? payload.text : undefined;

  return {
    subject,
    html,
    text,
    templateType: (templateType || EMAIL_TEMPLATE_TYPES.NOTIFICATION) as EmailTemplateType,
  };
}
