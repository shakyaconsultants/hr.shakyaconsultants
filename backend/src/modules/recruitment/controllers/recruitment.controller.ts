import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { CandidateService } from '@modules/recruitment/services/candidate.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import { InterviewService } from '@modules/recruitment/services/interview.service.js';
import { OfferService } from '@modules/recruitment/services/offer.service.js';
import { OnboardingService } from '@modules/recruitment/services/onboarding.service.js';
import { CandidateConversionService } from '@modules/recruitment/services/candidate-conversion.service.js';
import { RecruitmentDashboardService } from '@modules/recruitment/services/recruitment-dashboard.service.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';
import {
  candidateIdParamSchema,
  candidateListQuerySchema,
  cancelInterviewSchema,
  conversionSchema,
  createCandidateSchema,
  createInterviewSchema,
  createOfferSchema,
  idParamSchema,
  importCsvSchema,
  interviewFeedbackSchema,
  mergeCandidateSchema,
  onboardingDraftSchema,
  pipelineTransitionSchema,
  rescheduleInterviewSchema,
  updateCandidateSchema,
} from '@modules/recruitment/validators/recruitment.validator.js';

function buildActor(req: AuthenticatedRequest): RecruitmentActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const dashboard = await RecruitmentDashboardService.getDashboard(authReq.user.companyId);
    return ResponseService.success(res, authReq, dashboard);
  } catch (error) {
    next(error);
    return;
  }
};

export const listCandidates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(candidateListQuerySchema, req.query);
    const result = await CandidateService.list(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getCandidate: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const candidate = await CandidateService.getById(authReq.user.companyId, id);
    const timeline = await RecruitmentTimelineService.list(authReq.user.companyId, id);
    const resumes = await CandidateService.listResumes(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, { candidate, timeline, resumes });
  } catch (error) {
    next(error);
    return;
  }
};

export const createCandidate: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createCandidateSchema, req.body);
    const candidate = await CandidateService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, candidate);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateCandidate: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateCandidateSchema, req.body);
    const candidate = await CandidateService.update(buildActor(authReq), id, payload);
    return ResponseService.success(res, authReq, candidate);
  } catch (error) {
    next(error);
    return;
  }
};

export const archiveCandidate: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const candidate = await CandidateService.archive(buildActor(authReq), id);
    return ResponseService.success(res, authReq, candidate);
  } catch (error) {
    next(error);
    return;
  }
};

export const restoreCandidate: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const candidate = await CandidateService.restore(buildActor(authReq), id);
    return ResponseService.success(res, authReq, candidate);
  } catch (error) {
    next(error);
    return;
  }
};

export const mergeCandidates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { primaryId, secondaryId } = validateInput(mergeCandidateSchema, req.body);
    const candidate = await CandidateService.merge(buildActor(authReq), primaryId, secondaryId);
    return ResponseService.success(res, authReq, candidate);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportCandidates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(candidateListQuerySchema, req.query);
    const result = await CandidateService.list(authReq.user.companyId, { ...query, pageSize: 10000 });
    const csv = CandidateService.exportToCsv(result.items);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const importCandidates: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { content } = validateInput(importCsvSchema, req.body);
    const lines = content.trim().split(/\r?\n/);
    const headers = lines[0]?.split(',') ?? [];
    const actor = buildActor(authReq);
    const created: string[] = [];
    for (const line of lines.slice(1)) {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h.trim()] = values[i]?.trim() ?? ''; });
      if (!row.email || !row.firstName || !row.lastName) continue;
      const c = await CandidateService.create(actor, row);
      created.push(c.id);
    }
    return ResponseService.success(res, authReq, { imported: created.length, ids: created });
  } catch (error) {
    next(error);
    return;
  }
};

export const uploadResume: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { candidateId } = validateInput(candidateIdParamSchema, req.params);
    const file = req.file;
    if (!file) {
      throw new ValidationError('No file uploaded', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    const resume = await CandidateService.uploadResume(buildActor(authReq), candidateId, {
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
    });
    return ResponseService.created(res, authReq, resume);
  } catch (error) {
    next(error);
    return;
  }
};

export const getKanban: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const board = await CandidatePipelineService.getKanban(authReq.user.companyId);
    return ResponseService.success(res, authReq, board);
  } catch (error) {
    next(error);
    return;
  }
};

export const listPipelineStages: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const stages = await CandidatePipelineService.listStages(authReq.user.companyId);
    return ResponseService.success(res, authReq, stages);
  } catch (error) {
    next(error);
    return;
  }
};

export const transitionPipeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { toStage, reason } = validateInput(pipelineTransitionSchema, req.body);
    const candidate = await CandidateService.movePipelineStage(buildActor(authReq), id, toStage, reason);
    return ResponseService.success(res, authReq, candidate);
  } catch (error) {
    next(error);
    return;
  }
};

export const listInterviews: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const candidateLeadId = typeof req.query.candidateLeadId === 'string' ? req.query.candidateLeadId : undefined;
    const interviews = await InterviewService.list(authReq.user.companyId, { candidateLeadId });
    return ResponseService.success(res, authReq, interviews);
  } catch (error) {
    next(error);
    return;
  }
};

export const createInterview: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createInterviewSchema, req.body);
    const interview = await InterviewService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, interview);
  } catch (error) {
    next(error);
    return;
  }
};

export const rescheduleInterview: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { scheduledAt, meetingLink } = validateInput(rescheduleInterviewSchema, req.body);
    const interview = await InterviewService.reschedule(buildActor(authReq), id, scheduledAt, meetingLink);
    return ResponseService.success(res, authReq, interview);
  } catch (error) {
    next(error);
    return;
  }
};

export const cancelInterview: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { reason } = validateInput(cancelInterviewSchema, req.body);
    const interview = await InterviewService.cancel(buildActor(authReq), id, reason);
    return ResponseService.success(res, authReq, interview);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitFeedback: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(interviewFeedbackSchema, req.body);
    const feedback = await InterviewService.submitFeedback(buildActor(authReq), id, payload);
    return ResponseService.created(res, authReq, feedback);
  } catch (error) {
    next(error);
    return;
  }
};

export const listOffers: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const candidateLeadId = typeof req.query.candidateLeadId === 'string' ? req.query.candidateLeadId : undefined;
    const offers = await OfferService.list(authReq.user.companyId, candidateLeadId);
    return ResponseService.success(res, authReq, offers);
  } catch (error) {
    next(error);
    return;
  }
};

export const createOffer: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createOfferSchema, req.body);
    const offer = await OfferService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, offer);
  } catch (error) {
    next(error);
    return;
  }
};

export const sendOffer: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const offer = await OfferService.send(buildActor(authReq), id);
    return ResponseService.success(res, authReq, offer);
  } catch (error) {
    next(error);
    return;
  }
};

export const acceptOffer: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const offer = await OfferService.accept(buildActor(authReq), id);
    return ResponseService.success(res, authReq, offer);
  } catch (error) {
    next(error);
    return;
  }
};

export const rejectOffer: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const offer = await OfferService.reject(buildActor(authReq), id);
    return ResponseService.success(res, authReq, offer);
  } catch (error) {
    next(error);
    return;
  }
};

export const getOnboarding: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { candidateId } = validateInput(candidateIdParamSchema, req.params);
    const onboarding = await OnboardingService.getByCandidate(authReq.user.companyId, candidateId);
    return ResponseService.success(res, authReq, onboarding);
  } catch (error) {
    next(error);
    return;
  }
};

export const saveOnboardingDraft: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { candidateId } = validateInput(candidateIdParamSchema, req.params);
    const { section, data } = validateInput(onboardingDraftSchema, req.body);
    const onboarding = await OnboardingService.saveDraft(buildActor(authReq), candidateId, section, data);
    return ResponseService.success(res, authReq, onboarding);
  } catch (error) {
    next(error);
    return;
  }
};

export const completeOnboardingSection: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { candidateId } = validateInput(candidateIdParamSchema, req.params);
    const { section, data } = validateInput(onboardingDraftSchema, req.body);
    const onboarding = await OnboardingService.completeSection(buildActor(authReq), candidateId, section, data);
    return ResponseService.success(res, authReq, onboarding);
  } catch (error) {
    next(error);
    return;
  }
};

export const issueOnboardingPortal: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { candidateId } = validateInput(candidateIdParamSchema, req.params);
    const result = await OnboardingService.issuePortalLink(buildActor(authReq), candidateId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const convertCandidate: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(conversionSchema, req.body);
    const result = await CandidateConversionService.convert(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getCandidateTimeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { candidateId } = validateInput(candidateIdParamSchema, req.params);
    const timeline = await RecruitmentTimelineService.list(authReq.user.companyId, candidateId);
    return ResponseService.success(res, authReq, timeline);
  } catch (error) {
    next(error);
    return;
  }
};
