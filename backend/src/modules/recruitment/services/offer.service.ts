import { OfferLetterRepository, OFFER_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { UploadService } from '@infrastructure/storage/cloudinary.service.js';
import { NotFoundError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { CandidateService } from '@modules/recruitment/services/candidate.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentActivityService } from '@modules/recruitment/services/recruitment-activity.service.js';
import { RecruitmentEmailService } from '@modules/recruitment/services/recruitment-email.service.js';
import { OnboardingService } from '@modules/recruitment/services/onboarding.service.js';
import { renderOfferLetterHtml } from '@modules/recruitment/templates/offer-letter.template.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export const OfferService = {
  async list(companyId: string, candidateLeadId?: string) {
    const filter = candidateLeadId ? { candidateLeadId } : {};
    return OfferLetterRepository.findMany(filter, { companyId });
  },

  async getById(companyId: string, id: string) {
    const offer = await OfferLetterRepository.findById(id, { companyId });
    if (!offer) {
      throw new NotFoundError('Offer not found', ERROR_CODES.NOT_FOUND);
    }
    return offer;
  },

  async create(context: RecruitmentActorContext, payload: Record<string, unknown>) {
    const candidateLeadId = String(payload.candidateLeadId);
    const candidate = await CandidateService.getById(context.companyId, candidateLeadId);

    if (candidate.pipelineStage === PIPELINE_STAGE.REJECTED) {
      throw new ValidationError('Cannot create offer for rejected candidate', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    const existing = await OfferLetterRepository.findMany(
      { candidateLeadId, status: OFFER_STATUS.SENT },
      { companyId: context.companyId },
    );
    const version = existing.length > 0 ? Math.max(...existing.map((o) => o.version)) + 1 : 1;

    const joiningDate =
      payload.joiningDate instanceof Date
        ? payload.joiningDate
        : new Date(String(payload.joiningDate));
    const expiryDate =
      payload.expiryDate instanceof Date
        ? payload.expiryDate
        : new Date(String(payload.expiryDate));
    const salary = typeof payload.salary === 'number' ? payload.salary : Number(payload.salary);
    const salaryBreakdown =
      payload.salaryBreakdown && typeof payload.salaryBreakdown === 'object'
        ? (payload.salaryBreakdown as Record<string, unknown>)
        : { base: salary };
    const departmentLabel = typeof payload.departmentId === 'string' ? payload.departmentId : '';
    const currency = typeof payload.currency === 'string' ? payload.currency : 'INR';

    const htmlContent = renderOfferLetterHtml({
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      jobTitle: 'Position',
      department: departmentLabel,
      salary,
      currency,
      joiningDate: joiningDate.toLocaleDateString(),
      expiryDate: expiryDate.toLocaleDateString(),
      salaryBreakdown,
      companyName: 'HR Shakya',
    });

    const folder = `recruitment/candidates/${candidateLeadId}/offers`;
    const upload = await UploadService.uploadDocument({
      buffer: Buffer.from(htmlContent, 'utf-8'),
      folder,
      filename: `offer-v${String(version)}.html`,
      mimeType: 'text/html',
    });

    const id = generateUuid();
    const offer = await OfferLetterRepository.create(
      {
        id,
        companyId: context.companyId,
        candidateLeadId,
        salary,
        salaryBreakdown,
        joiningDate,
        expiryDate,
        htmlContent,
        documentUrl: upload.secureUrl,
        publicId: upload.publicId,
        version,
        status: OFFER_STATUS.DRAFT,
        ...payload,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'offer',
      entityId: id,
      action: 'create',
      after: RecruitmentAuditService.toRecord(offer),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return offer;
  },

  async send(context: RecruitmentActorContext, id: string) {
    const offer = await this.getById(context.companyId, id);
    const candidate = await CandidateService.getById(context.companyId, offer.candidateLeadId);

    const updated = await OfferLetterRepository.update(
      id,
      { status: OFFER_STATUS.SENT, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CandidatePipelineService.transition(
      context,
      offer.candidateLeadId,
      PIPELINE_STAGE.ONBOARDING,
      undefined,
      {
        skipNotification: true,
      },
    );
    await RecruitmentTimelineService.record(context, {
      candidateLeadId: offer.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.OFFER_SENT,
      title: `Offer letter v${String(offer.version)} sent`,
      metadata: { offerId: id },
    });

    await RecruitmentEmailService.sendOfferLetter(context, candidate.email, {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      joiningDate: offer.joiningDate.toLocaleDateString(),
      salary: `${offer.currency} ${offer.salary.toLocaleString()}`,
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'offer',
      entityId: id,
      action: 'update',
      after: { status: OFFER_STATUS.SENT },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async sendWithOnboarding(context: RecruitmentActorContext, id: string) {
    const sentOffer = await this.send(context, id);
    if (!sentOffer) {
      throw new NotFoundError('Offer not found', ERROR_CODES.NOT_FOUND);
    }

    await OnboardingService.start(context, sentOffer.candidateLeadId, id, sentOffer.joiningDate);
    const portal = await OnboardingService.issuePortalLink(context, sentOffer.candidateLeadId);

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: sentOffer.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.ONBOARDING_STARTED,
      title: 'Offer and onboarding form sent',
      metadata: { offerId: id, portalUrl: portal.portalUrl },
    });

    return { offer: sentOffer, portalUrl: portal.portalUrl, expiresAt: portal.expiresAt };
  },

  async accept(context: RecruitmentActorContext, id: string) {
    const offer = await this.getById(context.companyId, id);
    if (offer.status === OFFER_STATUS.DRAFT) {
      throw new ValidationError('Offer must be sent before acceptance', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }
    if (offer.expiryDate.getTime() < Date.now()) {
      throw new ValidationError('Offer has expired', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const updated = await OfferLetterRepository.update(
      id,
      { status: OFFER_STATUS.ACCEPTED, acceptedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await CandidatePipelineService.transition(
      context,
      offer.candidateLeadId,
      PIPELINE_STAGE.OFFER_ACCEPTED,
    );
    await RecruitmentTimelineService.record(context, {
      candidateLeadId: offer.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.OFFER_ACCEPTED,
      title: 'Offer accepted',
    });

    await RecruitmentActivityService.publish(context, {
      activityType: RecruitmentActivityService.TYPES.OFFER_ACCEPTED,
      description: 'Candidate accepted offer',
      entityType: 'offer',
      entityId: id,
    });

    return updated;
  },

  async reject(context: RecruitmentActorContext, id: string) {
    const offer = await this.getById(context.companyId, id);
    const updated = await OfferLetterRepository.update(
      id,
      { status: OFFER_STATUS.DECLINED, rejectedAt: new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: offer.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.OFFER_REJECTED,
      title: 'Offer declined',
    });

    return updated;
  },
};
