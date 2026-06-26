import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from '@shared/constants/notification.constants.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { EMAIL_TEMPLATE_TYPES } from '@shared/constants/email.constants.js';
import { EmailService } from '@infrastructure/email/email.service.js';
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

function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;"><h2>${title}</h2>${body}<hr><p style="font-size:12px;color:#888;">HR Shakya ERP — Automated message</p></body></html>`;
}

export const RecruitmentEmailTemplates = {
  interviewInvite(data: { candidateName: string; date: string; meetingLink?: string; interviewType: string }): EmailTemplateData {
    const body = `<p>Dear ${data.candidateName},</p><p>Your ${data.interviewType} interview is scheduled for <strong>${data.date}</strong>.</p>${data.meetingLink ? `<p><a href="${data.meetingLink}">Join Meeting</a></p>` : ''}<p>Best regards,<br/>HR Team</p>`;
    return { to: '', subject: 'Interview Invitation', html: wrapTemplate('Interview Invitation', body), text: `Interview scheduled for ${data.date}` };
  },
  interviewReminder(data: { candidateName: string; date: string }): EmailTemplateData {
    const body = `<p>Dear ${data.candidateName},</p><p>Reminder: your interview is tomorrow at <strong>${data.date}</strong>.</p>`;
    return { to: '', subject: 'Interview Reminder', html: wrapTemplate('Interview Reminder', body) };
  },
  reschedule(data: { candidateName: string; newDate: string }): EmailTemplateData {
    const body = `<p>Dear ${data.candidateName},</p><p>Your interview has been rescheduled to <strong>${data.newDate}</strong>.</p>`;
    return { to: '', subject: 'Interview Rescheduled', html: wrapTemplate('Interview Rescheduled', body) };
  },
  rejection(data: { candidateName: string }): EmailTemplateData {
    const body = `<p>Dear ${data.candidateName},</p><p>Thank you for your interest. After careful consideration, we will not be moving forward at this time.</p>`;
    return { to: '', subject: 'Application Update', html: wrapTemplate('Application Update', body) };
  },
  offerLetter(data: { candidateName: string; joiningDate: string; salary: string }): EmailTemplateData {
    const body = `<p>Dear ${data.candidateName},</p><p>We are pleased to offer you a position. Joining date: <strong>${data.joiningDate}</strong>. CTC: <strong>${data.salary}</strong>.</p><p>Please review the attached offer letter.</p>`;
    return { to: '', subject: 'Offer Letter', html: wrapTemplate('Offer Letter', body) };
  },
  joiningInstructions(data: { candidateName: string; joiningDate: string; location?: string }): EmailTemplateData {
    const body = `<p>Dear ${data.candidateName},</p><p>Welcome! Your joining date is <strong>${data.joiningDate}</strong>.${data.location ? ` Location: ${data.location}` : ''}</p>`;
    return { to: '', subject: 'Joining Instructions', html: wrapTemplate('Joining Instructions', body) };
  },
  welcome(data: { employeeName: string }): EmailTemplateData {
    const body = `<p>Dear ${data.employeeName},</p><p>Welcome to the team! Your employee account has been created.</p>`;
    return { to: '', subject: 'Welcome to the Team', html: wrapTemplate('Welcome', body) };
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

    await QueueProducer.addEmailJob(jobName, {
      ...payload,
      tenantId: context.companyId,
      userId: context.userId,
    }, delayMs ? { delay: delayMs } : undefined);
  },

  async sendInterviewInvite(context: RecruitmentActorContext, to: string, data: Parameters<typeof RecruitmentEmailTemplates.interviewInvite>[0]): Promise<void> {
    const template = RecruitmentEmailTemplates.interviewInvite(data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.INTERVIEW_INVITE, { ...template, to }, to);
  },

  async sendInterviewReminder(context: RecruitmentActorContext, to: string, data: Parameters<typeof RecruitmentEmailTemplates.interviewReminder>[0], delayMs = 86400000): Promise<void> {
    const template = RecruitmentEmailTemplates.interviewReminder(data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.INTERVIEW_REMINDER, { ...template, to }, to, delayMs);
  },

  async sendRejection(context: RecruitmentActorContext, to: string, data: Parameters<typeof RecruitmentEmailTemplates.rejection>[0]): Promise<void> {
    const template = RecruitmentEmailTemplates.rejection(data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.REJECTION, { ...template, to }, to);
  },

  async sendOfferLetter(context: RecruitmentActorContext, to: string, data: Parameters<typeof RecruitmentEmailTemplates.offerLetter>[0]): Promise<void> {
    const template = RecruitmentEmailTemplates.offerLetter(data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.OFFER_LETTER, { ...template, to }, to);
  },

  async sendWelcome(context: RecruitmentActorContext, to: string, data: Parameters<typeof RecruitmentEmailTemplates.welcome>[0]): Promise<void> {
    const template = RecruitmentEmailTemplates.welcome(data);
    await this.queueEmail(context, RECRUITMENT_EMAIL_JOB.WELCOME, { ...template, to }, to);
  },

  async createWelcomeNotification(context: RecruitmentActorContext, recipientId: string, title: string, body: string, entityId?: string): Promise<void> {
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
