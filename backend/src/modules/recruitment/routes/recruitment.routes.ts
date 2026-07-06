import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { uploadMiddleware } from '@config/upload.config.js';
import { RECRUITMENT_PERMISSIONS } from '@modules/recruitment/constants/recruitment-permissions.constants.js';
import {
  acceptOffer,
  archiveCandidate,
  cancelInterview,
  completeOnboardingSection,
  convertCandidate,
  createCandidate,
  createInterview,
  createOffer,
  exportCandidates,
  getCandidate,
  getCandidateTimeline,
  getDashboard,
  getKanban,
  getOnboarding,
  importCandidates,
  issueOnboardingPortal,
  listCandidates,
  listInterviews,
  listOffers,
  listPipelineStages,
  mergeCandidates,
  rejectOffer,
  rescheduleInterview,
  restoreCandidate,
  saveOnboardingDraft,
  sendOffer,
  sendOfferWithOnboarding,
  startOnboarding,
  submitFeedback,
  transitionPipeline,
  updateCandidate,
  uploadResume,
} from '@modules/recruitment/controllers/recruitment.controller.js';

const recruitmentRoutes = Router();

recruitmentRoutes.use(authenticateMiddleware);
recruitmentRoutes.use(companyScopeMiddleware());

/**
 * @swagger
 * /recruitment/dashboard:
 *   get:
 *     summary: Recruiter dashboard
 *     tags: [Recruitment]
 */
recruitmentRoutes.get(
  '/dashboard',
  authorize(RECRUITMENT_PERMISSIONS.DASHBOARD_READ),
  getDashboard,
);

recruitmentRoutes.get(
  '/candidates',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_READ),
  listCandidates,
);
recruitmentRoutes.post(
  '/candidates',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_CREATE),
  createCandidate,
);
recruitmentRoutes.get(
  '/candidates/export',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_EXPORT),
  exportCandidates,
);
recruitmentRoutes.post(
  '/candidates/import',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_IMPORT),
  importCandidates,
);
recruitmentRoutes.post(
  '/candidates/merge',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_MERGE),
  mergeCandidates,
);
recruitmentRoutes.get(
  '/candidates/:id',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_READ),
  getCandidate,
);
recruitmentRoutes.patch(
  '/candidates/:id',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_UPDATE),
  updateCandidate,
);
recruitmentRoutes.post(
  '/candidates/:id/archive',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_UPDATE),
  archiveCandidate,
);
recruitmentRoutes.post(
  '/candidates/:id/restore',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_UPDATE),
  restoreCandidate,
);
recruitmentRoutes.post(
  '/candidates/:id/pipeline',
  authorize(RECRUITMENT_PERMISSIONS.PIPELINE_MANAGE),
  transitionPipeline,
);
recruitmentRoutes.get(
  '/candidates/:candidateId/timeline',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_READ),
  getCandidateTimeline,
);
recruitmentRoutes.post(
  '/candidates/:candidateId/resume',
  authorize(RECRUITMENT_PERMISSIONS.CANDIDATE_UPDATE),
  uploadMiddleware.single('file'),
  uploadResume,
);

recruitmentRoutes.get(
  '/pipeline/kanban',
  authorize(RECRUITMENT_PERMISSIONS.PIPELINE_READ),
  getKanban,
);
recruitmentRoutes.get(
  '/pipeline/stages',
  authorize(RECRUITMENT_PERMISSIONS.PIPELINE_READ),
  listPipelineStages,
);

recruitmentRoutes.get(
  '/interviews',
  authorize(RECRUITMENT_PERMISSIONS.INTERVIEW_READ),
  listInterviews,
);
recruitmentRoutes.post(
  '/interviews',
  authorize(RECRUITMENT_PERMISSIONS.INTERVIEW_CREATE),
  createInterview,
);
recruitmentRoutes.patch(
  '/interviews/:id/reschedule',
  authorize(RECRUITMENT_PERMISSIONS.INTERVIEW_UPDATE),
  rescheduleInterview,
);
recruitmentRoutes.post(
  '/interviews/:id/cancel',
  authorize(RECRUITMENT_PERMISSIONS.INTERVIEW_UPDATE),
  cancelInterview,
);
recruitmentRoutes.post(
  '/interviews/:id/feedback',
  authorize(RECRUITMENT_PERMISSIONS.INTERVIEW_UPDATE),
  submitFeedback,
);

recruitmentRoutes.get('/offers', authorize(RECRUITMENT_PERMISSIONS.OFFER_READ), listOffers);
recruitmentRoutes.post('/offers', authorize(RECRUITMENT_PERMISSIONS.OFFER_CREATE), createOffer);
recruitmentRoutes.post(
  '/offers/:id/send',
  authorize(RECRUITMENT_PERMISSIONS.OFFER_UPDATE),
  sendOffer,
);
recruitmentRoutes.post(
  '/offers/:id/send-with-onboarding',
  authorize(RECRUITMENT_PERMISSIONS.OFFER_UPDATE),
  sendOfferWithOnboarding,
);
recruitmentRoutes.post(
  '/offers/:id/accept',
  authorize(RECRUITMENT_PERMISSIONS.OFFER_UPDATE),
  acceptOffer,
);
recruitmentRoutes.post(
  '/offers/:id/reject',
  authorize(RECRUITMENT_PERMISSIONS.OFFER_UPDATE),
  rejectOffer,
);

recruitmentRoutes.post(
  '/onboarding/:candidateId/start',
  authorize(RECRUITMENT_PERMISSIONS.ONBOARDING_MANAGE),
  startOnboarding,
);
recruitmentRoutes.post(
  '/onboarding/:candidateId/portal-link',
  authorize(RECRUITMENT_PERMISSIONS.ONBOARDING_MANAGE),
  issueOnboardingPortal,
);
recruitmentRoutes.get(
  '/onboarding/:candidateId',
  authorize(RECRUITMENT_PERMISSIONS.ONBOARDING_READ),
  getOnboarding,
);
recruitmentRoutes.patch(
  '/onboarding/:candidateId/draft',
  authorize(RECRUITMENT_PERMISSIONS.ONBOARDING_MANAGE),
  saveOnboardingDraft,
);
recruitmentRoutes.post(
  '/onboarding/:candidateId/complete-section',
  authorize(RECRUITMENT_PERMISSIONS.ONBOARDING_MANAGE),
  completeOnboardingSection,
);

recruitmentRoutes.post(
  '/conversion',
  authorize(RECRUITMENT_PERMISSIONS.CONVERSION_EXECUTE),
  convertCandidate,
);

export { recruitmentRoutes };
