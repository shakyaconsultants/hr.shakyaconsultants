import { InterviewRepository, InterviewFeedbackRepository } from '@domain/recruitment/recruitment.schemas.js';
import { INTERVIEW_STATUS } from '@shared/constants/status.constants.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { NotFoundError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { CandidateService } from '@modules/recruitment/services/candidate.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentActivityService } from '@modules/recruitment/services/recruitment-activity.service.js';
import { RecruitmentEmailService, RecruitmentEmailTemplates } from '@modules/recruitment/services/recruitment-email.service.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export const InterviewService = {
  async list(companyId: string, filters: { candidateLeadId?: string; from?: Date; to?: Date; status?: string } = {}) {
    const query: Record<string, unknown> = {};
    if (filters.candidateLeadId) {
      query.candidateLeadId = filters.candidateLeadId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    const interviews = await InterviewRepository.findMany(query, { companyId });
    if (filters.from || filters.to) {
      return interviews.filter((i) => {
        const t = i.scheduledAt.getTime();
        if (filters.from && t < filters.from.getTime()) {
          return false;
        }
        if (filters.to && t > filters.to.getTime()) {
          return false;
        }
        return true;
      });
    }
    return interviews.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  },

  async create(context: RecruitmentActorContext, payload: Record<string, unknown>) {
    const candidateLeadId = String(payload.candidateLeadId);
    const candidate = await CandidateService.getById(context.companyId, candidateLeadId);

    if (candidate.pipelineStage === PIPELINE_STAGE.REJECTED) {
      throw new ValidationError('Cannot schedule interview for rejected candidate', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const scheduledAt = payload.scheduledAt instanceof Date ? payload.scheduledAt : new Date(String(payload.scheduledAt));
    if (scheduledAt.getTime() < Date.now()) {
      throw new ValidationError('Interview cannot be scheduled in the past', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const id = generateUuid();
    const interview = await InterviewRepository.create(
      {
        id,
        companyId: context.companyId,
        round: typeof payload.round === 'number' ? payload.round : 1,
        interviewType: typeof payload.interviewType === 'string' ? payload.interviewType : 'online',
        status: INTERVIEW_STATUS.SCHEDULED,
        ...payload,
        scheduledAt,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await CandidatePipelineService.transition(context, candidateLeadId, PIPELINE_STAGE.INTERVIEW_SCHEDULED);

    await RecruitmentTimelineService.record(context, {
      candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.INTERVIEW_SCHEDULED,
      title: `Interview round ${String(interview.round)} scheduled`,
      metadata: { interviewId: id, scheduledAt },
    });

    await RecruitmentActivityService.publish(context, {
      activityType: RecruitmentActivityService.TYPES.INTERVIEW_SCHEDULED,
      description: `Interview scheduled for ${candidate.firstName} ${candidate.lastName}`,
      entityType: 'interview',
      entityId: id,
    });

    await RecruitmentEmailService.sendInterviewInvite(context, candidate.email, {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      date: scheduledAt.toLocaleString(),
      meetingLink: interview.meetingLink,
      interviewType: interview.interviewType,
    });

    const reminderDelay = scheduledAt.getTime() - Date.now() - 86400000;
    if (reminderDelay > 0) {
      await RecruitmentEmailService.sendInterviewReminder(
        context,
        candidate.email,
        { candidateName: `${candidate.firstName} ${candidate.lastName}`, date: scheduledAt.toLocaleString() },
        reminderDelay,
      );
    }

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'interview',
      entityId: id,
      action: 'create',
      after: RecruitmentAuditService.toRecord(interview),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return interview;
  },

  async reschedule(context: RecruitmentActorContext, id: string, scheduledAt: Date, meetingLink?: string) {
    const before = await InterviewRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Interview not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await InterviewRepository.update(
      id,
      { scheduledAt, meetingLink, rescheduledFromId: id, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Interview not found', ERROR_CODES.NOT_FOUND);
    }

    const candidate = await CandidateService.getById(context.companyId, before.candidateLeadId);
    await RecruitmentTimelineService.record(context, {
      candidateLeadId: before.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.INTERVIEW_RESCHEDULED,
      title: 'Interview rescheduled',
      metadata: { interviewId: id, scheduledAt },
    });

    const template = RecruitmentEmailTemplates.reschedule({
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      newDate: scheduledAt.toLocaleString(),
    });
    await RecruitmentEmailService.queueEmail(
      context,
      'recruitment.interview_reschedule',
      { ...template, to: candidate.email },
      candidate.email,
    );

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'interview',
      entityId: id,
      action: 'update',
      before: RecruitmentAuditService.toRecord(before),
      after: RecruitmentAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async cancel(context: RecruitmentActorContext, id: string, reason?: string) {
    const before = await InterviewRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Interview not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await InterviewRepository.update(
      id,
      { status: INTERVIEW_STATUS.CANCELLED, cancelledReason: reason, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: before.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.INTERVIEW_CANCELLED,
      title: 'Interview cancelled',
      metadata: { reason },
    });

    return updated;
  },

  async complete(context: RecruitmentActorContext, id: string, data: { score?: number; decision?: string; notes?: string }) {
    const before = await InterviewRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Interview not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await InterviewRepository.update(
      id,
      { status: INTERVIEW_STATUS.COMPLETED, ...data, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CandidatePipelineService.transition(context, before.candidateLeadId, PIPELINE_STAGE.INTERVIEW_COMPLETED);
    await RecruitmentTimelineService.record(context, {
      candidateLeadId: before.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.INTERVIEW_COMPLETED,
      title: 'Interview completed',
      metadata: data,
    });

    return updated;
  },

  async submitFeedback(context: RecruitmentActorContext, interviewId: string, payload: Record<string, unknown>) {
    const interview = await InterviewRepository.findById(interviewId, { companyId: context.companyId });
    if (!interview) {
      throw new NotFoundError('Interview not found', ERROR_CODES.NOT_FOUND);
    }

    const id = generateUuid();
    const feedback = await InterviewFeedbackRepository.create(
      {
        id,
        companyId: context.companyId,
        interviewId,
        interviewerId: context.userId,
        ...payload,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: interview.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.FEEDBACK_SUBMITTED,
      title: 'Interview feedback submitted',
      metadata: { feedbackId: id },
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'interview_feedback',
      entityId: id,
      action: 'create',
      after: RecruitmentAuditService.toRecord(feedback),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return feedback;
  },
};
