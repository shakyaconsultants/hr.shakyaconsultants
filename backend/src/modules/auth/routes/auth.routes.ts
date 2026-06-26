import { Router } from 'express';
import { AUTH_ROUTES } from '@modules/auth/constants/auth.constants.js';
import {
  forgotPassword,
  getMe,
  listSessions,
  listSessionHistory,
  login,
  logout,
  logoutAll,
  refresh,
  resetPassword,
  revokeSession,
} from '@modules/auth/controllers/auth.controller.js';
import { bootstrap, getSystemStatus } from '@modules/auth/controllers/bootstrap.controller.js';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { createLoginRateLimitMiddleware } from '@modules/auth/middleware/login-rate-limit.middleware.js';
import { systemInitMiddleware } from '@modules/auth/middleware/system-init.middleware.js';

const authRoutes = Router();

authRoutes.use(systemInitMiddleware());

/**
 * @swagger
 * /auth/bootstrap:
 *   post:
 *     summary: Initialize the ERP system
 *     description: Idempotent bootstrap wizard — creates company, branch, permissions, roles, and super admin user. Only available when no company exists.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company, admin]
 *             properties:
 *               company:
 *                 type: object
 *               admin:
 *                 type: object
 *     responses:
 *       201:
 *         description: System initialized successfully
 *       409:
 *         description: System already initialized
 */
authRoutes.post(AUTH_ROUTES.BOOTSTRAP, bootstrap);

/**
 * @swagger
 * /auth/system/status:
 *   get:
 *     summary: Get system initialization status
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Initialization status
 */
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
authRoutes.post(AUTH_ROUTES.REFRESH, refresh);

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
authRoutes.post(AUTH_ROUTES.LOGOUT, authenticateMiddleware, logout);

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
authRoutes.post(AUTH_ROUTES.FORGOT_PASSWORD, forgotPassword);

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
authRoutes.post(AUTH_ROUTES.RESET_PASSWORD, resetPassword);

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
authRoutes.get(AUTH_ROUTES.SESSIONS, authenticateMiddleware, listSessions);
authRoutes.get(AUTH_ROUTES.SESSIONS_HISTORY, authenticateMiddleware, listSessionHistory);
authRoutes.post(AUTH_ROUTES.SESSION_REVOKE, authenticateMiddleware, revokeSession);

export { authRoutes };
