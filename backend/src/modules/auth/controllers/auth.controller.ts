import type { Request, Response } from 'express';
import { AUTH_COOKIE_NAMES } from '@modules/auth/constants/auth.constants.js';
import { AuthService } from '@modules/auth/services/auth.service.js';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  resetPasswordSchema,
} from '@modules/auth/validators/auth.validator.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import {
  clearAuthCookies,
  extractRefreshToken,
  setAuthCookies,
} from '@modules/auth/utils/cookie.util.js';
import {
  sanitizeAuthLoginResponse,
  sanitizeAuthRefreshResponse,
} from '@modules/auth/utils/auth-response.util.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ResponseService } from '@shared/services/response.service.js';
import { asyncHandler } from '@middleware/async-handler.middleware.js';

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
    correlationId: req.correlationId,
  };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = validateInput(loginSchema, req.body);
  const result = await AuthService.login(input, getRequestMeta(req));
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  ResponseService.success(res, req, sanitizeAuthLoginResponse(result));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const body = validateInput(refreshSchema, req.body);
  const refreshToken = extractRefreshToken(
    body.refreshToken,
    req.cookies[AUTH_COOKIE_NAMES.REFRESH] as string | undefined,
  );

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const result = await AuthService.refresh(refreshToken, getRequestMeta(req));
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  ResponseService.success(res, req, sanitizeAuthRefreshResponse(result));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const body = validateInput(logoutSchema, req.body);
  const refreshToken = extractRefreshToken(
    body.refreshToken,
    req.cookies[AUTH_COOKIE_NAMES.REFRESH] as string | undefined,
  );

  const result = await AuthService.logout(authReq.user, refreshToken, getRequestMeta(req));
  clearAuthCookies(res);
  ResponseService.success(res, req, result);
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await AuthService.logoutAllDevices(authReq.user, getRequestMeta(req));
  clearAuthCookies(res);
  ResponseService.success(res, req, result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = validateInput(forgotPasswordSchema, req.body);
  const result = await AuthService.forgotPassword(input, getRequestMeta(req));
  ResponseService.success(res, req, result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = validateInput(resetPasswordSchema, req.body);
  const result = await AuthService.resetPassword(input, getRequestMeta(req));
  ResponseService.success(res, req, result);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await AuthService.getCurrentUser(authReq.user);
  ResponseService.success(res, req, result);
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await AuthService.listSessions(authReq.user);
  ResponseService.success(res, req, result);
});

export const listSessionHistory = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const result = await AuthService.listSessionHistory(authReq.user);
  ResponseService.success(res, req, result);
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const sessionIdParam = req.params.sessionId;
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
  if (!sessionId) {
    throw new ValidationError('Session ID is required');
  }
  const result = await AuthService.revokeSession(authReq.user, sessionId, getRequestMeta(req));
  ResponseService.success(res, req, result);
});
