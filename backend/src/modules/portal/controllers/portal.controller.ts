import type { RequestHandler } from 'express';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { ResponseService } from '@shared/services/response.service.js';
import { PortalOnboardingService } from '@modules/portal/services/portal-onboarding.service.js';
import { AccountActivationService } from '@modules/auth/services/account-activation.service.js';
import { portalDraftSchema, portalTokenParamSchema, activateAccountSchema } from '@modules/portal/validators/portal.validator.js';

export const getOnboardingPortal: RequestHandler = async (req, res, next) => {
  try {
    const { token } = validateInput(portalTokenParamSchema, req.params);
    const data = await PortalOnboardingService.getPortalState(token);
    return ResponseService.success(res, req, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const saveOnboardingDraft: RequestHandler = async (req, res, next) => {
  try {
    const { token } = validateInput(portalTokenParamSchema, req.params);
    const payload = validateInput(portalDraftSchema, req.body);
    const data = await PortalOnboardingService.saveDraft(token, payload.section, payload.data);
    return ResponseService.success(res, req, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const submitOnboardingPortal: RequestHandler = async (req, res, next) => {
  try {
    const { token } = validateInput(portalTokenParamSchema, req.params);
    const data = await PortalOnboardingService.submit(token);
    return ResponseService.success(res, req, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getActivationStatus: RequestHandler = async (req, res, next) => {
  try {
    const { token } = validateInput(portalTokenParamSchema, req.params);
    const data = await AccountActivationService.getActivationStatus(token);
    return ResponseService.success(res, req, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const activateAccount: RequestHandler = async (req, res, next) => {
  try {
    const { token } = validateInput(portalTokenParamSchema, req.params);
    const { password } = validateInput(activateAccountSchema, req.body);
    const data = await AccountActivationService.activateAccount(token, password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ResponseService.success(res, req, data);
  } catch (error) {
    next(error);
    return;
  }
};
