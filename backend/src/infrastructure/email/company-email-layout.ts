import type { CompanyEmailBranding } from '@infrastructure/email/email-branding.service.js';

export interface CompanyEmailCta {
  label: string;
  url: string;
}

export interface CompanyEmailContent {
  branding: CompanyEmailBranding;
  previewText?: string;
  title: string;
  greeting?: string;
  bodyHtml: string;
  cta?: CompanyEmailCta;
  footerNote?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInfoRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(value)}</td></tr>`;
}

function renderCredentialsBox(rows: Array<{ label: string; value: string }>): string {
  const body = rows.map((row) => renderInfoRow(row.label, row.value)).join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">${body}</table>`;
}

export function renderCredentialsSection(rows: Array<{ label: string; value: string }>): string {
  return renderCredentialsBox(rows);
}

export function renderCompanyEmail(content: CompanyEmailContent): { html: string; text: string } {
  const { branding, title, bodyHtml, cta, footerNote, greeting, previewText } = content;
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting ?? 'Hello,');
  const safePreview = escapeHtml(previewText ?? title);
  const safeCompany = escapeHtml(branding.companyName);
  const safeApp = escapeHtml(branding.appName);

  const logoBlock = branding.logoUrl
    ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${safeCompany}" height="48" style="display:block;max-height:48px;margin-bottom:12px;" />`
    : `<div style="font-size:22px;font-weight:700;color:#0f172a;margin-bottom:4px;">${safeCompany}</div>`;

  const ctaBlock = cta
    ? `<p style="margin:28px 0;"><a href="${escapeHtml(cta.url)}" style="background:#2563eb;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">${escapeHtml(cta.label)}</a></p>`
    : '';

  const contactLines = [
    branding.supportEmail ? `Email: ${branding.supportEmail}` : undefined,
    branding.phone ? `Phone: ${branding.phone}` : undefined,
    branding.website ? `Website: ${branding.website}` : undefined,
    branding.addressLine,
  ].filter(Boolean);

  const contactBlock = contactLines.length
    ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6;">${contactLines.map((line) => `<div>${escapeHtml(line ?? '')}</div>`).join('')}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Segoe UI, Arial, sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:28px 28px 12px;background:linear-gradient(180deg,#f8fafc 0%,#ffffff 100%);">
              ${logoBlock}
              <div style="font-size:13px;color:#64748b;">${safeApp}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a;">${safeTitle}</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">${safeGreeting}</p>
              <div style="font-size:15px;line-height:1.7;color:#334155;">${bodyHtml}</div>
              ${ctaBlock}
              ${footerNote ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">${escapeHtml(footerNote)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              ${contactBlock}
              <p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;">This is an automated message from ${safeCompany}. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    title,
    '',
    greeting ?? 'Hello,',
    bodyHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    cta ? `${cta.label}: ${cta.url}` : undefined,
    footerNote,
    '',
    branding.companyName,
    ...contactLines,
  ].filter(Boolean);

  return { html, text: textParts.join('\n') };
}
