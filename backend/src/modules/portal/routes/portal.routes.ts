import { Router } from 'express';
import {
  activateAccount,
  getActivationStatus,
  getOnboardingPortal,
  saveOnboardingDraft,
  submitOnboardingPortal,
} from '@modules/portal/controllers/portal.controller.js';

const portalRoutes = Router();

/** Public portal routes — no authentication */
portalRoutes.get('/onboarding/:token', getOnboardingPortal);
portalRoutes.put('/onboarding/:token/draft', saveOnboardingDraft);
portalRoutes.post('/onboarding/:token/submit', submitOnboardingPortal);
portalRoutes.get('/account-activation/:token/status', getActivationStatus);
portalRoutes.post('/account-activation/:token/activate', activateAccount);

export { portalRoutes };
