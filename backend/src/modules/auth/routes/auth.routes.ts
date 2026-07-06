import { Router } from 'express';
import { AUTH_ROUTES } from '@modules/auth/constants/auth.constants.js';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  logoutAll,
  refresh,
  resetPassword,
} from '@modules/auth/controllers/auth.controller.js';
import { getSystemStatus } from '@modules/auth/controllers/system-status.controller.js';
import {
  authenticateMiddleware,
  optionalAuthenticateMiddleware,
} from '@modules/auth/middleware/authenticate.middleware.js';
import { createLoginRateLimitMiddleware } from '@modules/auth/middleware/login-rate-limit.middleware.js';
import {
  forgotPasswordRateLimitMiddleware,
  refreshRateLimitMiddleware,
  resetPasswordRateLimitMiddleware,
} from '@modules/auth/middleware/auth-endpoint-rate-limit.middleware.js';
import { systemInitMiddleware } from '@modules/auth/middleware/system-init.middleware.js';

const authRoutes = Router();

authRoutes.use(systemInitMiddleware());

authRoutes.get(AUTH_ROUTES.SYSTEM_STATUS, getSystemStatus);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyCode, email, password]
 *             properties:
 *               companyCode:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
authRoutes.post(AUTH_ROUTES.LOGIN, createLoginRateLimitMiddleware(), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */
authRoutes.post(AUTH_ROUTES.REFRESH, refreshRateLimitMiddleware, refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
authRoutes.post(AUTH_ROUTES.LOGOUT, optionalAuthenticateMiddleware, logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 */
authRoutes.post(AUTH_ROUTES.LOGOUT_ALL, authenticateMiddleware, logoutAll);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyCode, email]
 *             properties:
 *               companyCode:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email queued if account exists
 */
authRoutes.post(AUTH_ROUTES.FORGOT_PASSWORD, forgotPasswordRateLimitMiddleware, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
authRoutes.post(AUTH_ROUTES.RESET_PASSWORD, resetPasswordRateLimitMiddleware, resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile with permissions
 */
authRoutes.get(AUTH_ROUTES.ME, authenticateMiddleware, getMe);

export { authRoutes };
