import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
} from '@shared/constants/notification.constants.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { EMAIL_TEMPLATE_TYPES } from '@shared/constants/email.constants.js';
import { EmailService } from '@infrastructure/email/email.service.js';
import {
  EmailBrandingService,
  type CompanyEmailBranding,
} from '@infrastructure/email/email-branding.service.js';
import {
  renderCompanyEmail,
  renderCredentialsSection,
} from '@infrastructure/email/company-email-layout.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { RECRUITMENT_EMAIL_JOB } from '@modules/recruitment/constants/recruitment.constants.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function buildBrandedEmail(
  branding: CompanyEmailBranding,
  params: {
    subject: string;
    title: string;
    greeting?: string;
    previewText?: string;
    bodyHtml: string;
    cta?: { label: string; url: string };
    footerNote?: string;
  },
): EmailTemplateData {
  const rendered = renderCompanyEmail({
    branding,
    title: params.title,
    greeting: params.greeting,
    previewText: params.previewText ?? params.subject,
    bodyHtml: params.bodyHtml,
    cta: params.cta,
    footerNote: params.footerNote,
  });

  return {
    to: '',
    subject: params.subject,
    html: rendered.html,
    text: rendered.text,
  };
}

export const RecruitmentEmailTemplates = {
  interviewInvite(
    branding: CompanyEmailBranding,
    data: {
      candidateName: string;
      date: string;
      meetingLink?: string;
      interviewType: string;
    },
  ): EmailTemplateData {
    const bodyHtml = `<p>Your ${data.interviewType} interview with <strong>${branding.companyName}</strong> is scheduled for <strong>${data.date}</strong>.</p>${data.meetingLink ? `<p>Meeting link: <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}<p>We look forward to speaking with you.</p>`;
    return buildBrandedEmail(branding, {
      subject: `Interview invitation — ${branding.companyName}`,
      title: 'Interview invitation',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml,
      cta: data.meetingLink ? { label: 'Join interview', url: data.meetingLink } : undefined,
    });
  },

  interviewReminder(
    branding: CompanyEmailBranding,
    data: { candidateName: string; date: string },
  ): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Interview reminder — ${branding.companyName}`,
      title: 'Interview reminder',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml: `<p>This is a reminder that your interview with <strong>${branding.companyName}</strong> is scheduled for <strong>${data.date}</strong>.</p>`,
    });
  },

  reschedule(
    branding: CompanyEmailBranding,
    data: { candidateName: string; newDate: string },
  ): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Interview rescheduled — ${branding.companyName}`,
      title: 'Interview rescheduled',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml: `<p>Your interview with <strong>${branding.companyName}</strong> has been rescheduled to <strong>${data.newDate}</strong>.</p>`,
    });
  },

  rejection(branding: CompanyEmailBranding, data: { candidateName: string }): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Application update — ${branding.companyName}`,
      title: 'Application update',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml: `<p>Thank you for your interest in <strong>${branding.companyName}</strong>. After careful consideration, we will not be moving forward with your application at this time.</p><p>We appreciate the time you invested and wish you success in your career journey.</p>`,
    });
  },

  stageUpdate(
    branding: CompanyEmailBranding,
    data: {
      candidateName: string;
      stageName: string;
      message?: string;
    },
  ): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Application status update — ${branding.companyName}`,
      title: 'Application status update',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml: `<p>Your application status with <strong>${branding.companyName}</strong> has been updated to <strong>${data.stageName}</strong>.</p>${data.message ? `<p>${data.message}</p>` : ''}`,
    });
  },

  offerLetter(
    branding: CompanyEmailBranding,
    data: {
      candidateName: string;
      joiningDate: string;
      salary: string;
    },
  ): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Offer letter — ${branding.companyName}`,
      title: 'Offer letter',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml: `<p>We are pleased to offer you a position at <strong>${branding.companyName}</strong>.</p>${renderCredentialsSection(
        [
          { label: 'Joining date', value: data.joiningDate },
          { label: 'CTC', value: data.salary },
        ],
      )}<p>Please review the attached offer letter and follow the next steps shared by our HR team.</p>`,
    });
  },

  joiningInstructions(
    branding: CompanyEmailBranding,
    data: {
      candidateName: string;
      joiningDate: string;
      location?: string;
    },
  ): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Joining instructions — ${branding.companyName}`,
      title: 'Joining instructions',
      greeting: `Dear ${data.candidateName},`,
      bodyHtml: `<p>Welcome to <strong>${branding.companyName}</strong>!</p>${renderCredentialsSection(
        [
          { label: 'Joining date', value: data.joiningDate },
          ...(data.location ? [{ label: 'Location', value: data.location }] : []),
        ],
      )}`,
    });
  },

  welcome(branding: CompanyEmailBranding, data: { employeeName: string }): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Welcome to ${branding.companyName}`,
      title: 'Welcome to the team',
      greeting: `Dear ${data.employeeName},`,
      bodyHtml: `<p>Welcome to <strong>${branding.companyName}</strong>! Your employee account has been created and our team is excited to have you onboard.</p>`,
    });
  },

  accountCredentials(
    branding: CompanyEmailBranding,
    data: {
      employeeName: string;
      email: string;
      password: string;
      loginUrl: string;
    },
  ): EmailTemplateData {
    return buildBrandedEmail(branding, {
      subject: `Welcome to ${branding.companyName} — your employee account`,
      title: `Welcome to ${branding.companyName}`,
      greeting: `Dear ${data.employeeName},`,
      previewText: `Your employee portal account at ${branding.companyName} is ready`,
      bodyHtml: `<p>Your employee portal account has been created. Use the credentials below to sign in, review company information, and complete your onboarding profile.</p>${renderCredentialsSection(
        [
          { label: 'Portal URL', value: data.loginUrl },
          { label: 'Email', value: data.email },
          { label: 'Temporary password', value: data.password },
        ],
      )}<p>After signing in, please update your profile and complete any pending onboarding steps assigned by HR.</p>`,
      cta: { label: 'Open employee portal', url: data.loginUrl },
      footerNote:
        'If you did not expect this email, please contact your HR administrator immediately.',
    });
  },
};

export const RecruitmentEmailService = {
  async queueEmail(
    context: RecruitmentActorContext,
    jobName: string,
    template: EmailTemplateData,
    recipientEmail: string,
    delayMs?: number,
  ): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const payload = EmailService.buildJobPayload(
      EMAIL_TEMPLATE_TYPES.NOTIFICATION,
      recipientEmail,
      template.subject,
      { html: template.html, text: template.text, jobName },
      correlationId,
      context.companyId,
    );

    await QueueProducer.addEmailJob(
      jobName,
      {
        ...payload,
        tenantId: context.companyId,
        userId: context.userId,
      },
      delayMs ? { delay: delayMs } : undefined,
    );
  },

  async sendInterviewInvite(
    context: RecruitmentActorContext,
    to: string,
    data: Omit<Parameters<typeof RecruitmentEmailTemplates.interviewInvite>[1], never>,
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.interviewInvite(branding, data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.INTERVIEW_INVITE, { ...template, to }, to);
  },

  async sendInterviewReminder(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.interviewReminder>[1],
    delayMs = 86400000,
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.interviewReminder(branding, data);
    await this.queueEmail(
      context,
      RECRUITMENT_EMAIL_JOB.INTERVIEW_REMINDER,
      { ...template, to },
      to,
      delayMs,
    );
  },

  async sendReschedule(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.reschedule>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.reschedule(branding, data);
    await this.queueEmail(context, 'recruitment.interview_reschedule', { ...template, to }, to);
  },

  async sendRejection(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.rejection>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.rejection(branding, data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.REJECTION, { ...template, to }, to);
  },

  async sendStageUpdate(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.stageUpdate>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.stageUpdate(branding, data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.STAGE_UPDATE, { ...template, to }, to);
  },

  async sendOfferLetter(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.offerLetter>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.offerLetter(branding, data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.OFFER_LETTER, { ...template, to }, to);
  },

  async sendJoiningInstructions(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.joiningInstructions>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.joiningInstructions(branding, data);
    await this.queueEmail(
      context,
      RECRUITMENT_EMAIL_JOB.JOINING_INSTRUCTIONS,
      { ...template, to },
      to,
    );
  },

  async sendWelcome(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.welcome>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.welcome(branding, data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.WELCOME, { ...template, to }, to);
  },

  async sendAccountCredentials(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.accountCredentials>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.accountCredentials(branding, data);
    await this.queueEmail(
      context,
      RECRUITMENT_EMAIL_JOB.ACCOUNT_CREDENTIALS,
      { ...template, to },
      to,
    );
  },

  /** Sends account credentials immediately via SMTP (not queued). Used for employee onboarding. */
  async sendAccountCredentialsNow(
    context: RecruitmentActorContext,
    to: string,
    data: Parameters<typeof RecruitmentEmailTemplates.accountCredentials>[1],
  ): Promise<void> {
    const branding = await EmailBrandingService.getBranding(context.companyId);
    const template = RecruitmentEmailTemplates.accountCredentials(branding, data);
    const correlationId = getCorrelationId() ?? 'system';
    await EmailService.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      templateType: EMAIL_TEMPLATE_TYPES.NOTIFICATION,
      correlationId,
      tenantId: context.companyId,
    });
  },

  async createWelcomeNotification(
    context: RecruitmentActorContext,
    recipientId: string,
    title: string,
    body: string,
    entityId?: string,
  ): Promise<void> {
    await NotificationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        recipientId,
        title,
        body,
        channel: NOTIFICATION_CHANNELS.DATABASE,
        status: NOTIFICATION_STATUS.PENDING,
        entityType: 'employee',
        entityId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await QueueProducer.addNotificationJob('recruitment.welcome', {
      tenantId: context.companyId,
      recipientId,
      title,
      body,
      entityId,
    });
  },
};
