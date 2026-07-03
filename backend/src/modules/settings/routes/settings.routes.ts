import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { authorize } from '@modules/auth/middleware/authorize.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { SETTINGS_ROUTES } from '@modules/organization/constants/organization.constants.js';
import { SETTINGS_PERMISSIONS } from '@modules/settings/constants/settings-permissions.constants.js';
import {
  createSetting,
  deleteSetting,
  getPublicSettings,
  getSettingByKey,
  getSettingHistory,
  getSettingsByGroup,
  listFeatureFlags,
  listSettings,
  testEmailSettings,
  toggleFeatureFlag,
  updateSetting,
} from '@modules/settings/controllers/settings.controller.js';

const settingsRoutes = Router();

settingsRoutes.use(authenticateMiddleware);
settingsRoutes.use(companyScopeMiddleware());

settingsRoutes.get('/history/:key', authorize(SETTINGS_PERMISSIONS.READ), getSettingHistory);
settingsRoutes.get('/feature-flags', authorize(SETTINGS_PERMISSIONS.READ), listFeatureFlags);
settingsRoutes.patch('/feature-flags/:flagKey', authorize(SETTINGS_PERMISSIONS.MANAGE), toggleFeatureFlag);
settingsRoutes.post('/email/test', authorize(SETTINGS_PERMISSIONS.MANAGE), testEmailSettings);

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: List application settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings list
 */
settingsRoutes.get('/', authorize(SETTINGS_PERMISSIONS.READ), listSettings);

/**
 * @swagger
 * /settings/public:
 *   get:
 *     summary: Get public settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public settings
 */
settingsRoutes.get(SETTINGS_ROUTES.PUBLIC, authorize(SETTINGS_PERMISSIONS.READ), getPublicSettings);

/**
 * @swagger
 * /settings/group/{group}:
 *   get:
 *     summary: Get settings by group
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group settings
 */
settingsRoutes.get(`${SETTINGS_ROUTES.GROUP}/:group`, authorize(SETTINGS_PERMISSIONS.READ), getSettingsByGroup);

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     summary: Get setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setting details
 */
settingsRoutes.get('/:key', authorize(SETTINGS_PERMISSIONS.READ), getSettingByKey);

/**
 * @swagger
 * /settings:
 *   post:
 *     summary: Create setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Setting created
 */
settingsRoutes.post('/', authorize(SETTINGS_PERMISSIONS.MANAGE), createSetting);

/**
 * @swagger
 * /settings/{key}:
 *   patch:
 *     summary: Update setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setting updated
 */
settingsRoutes.patch('/:key', authorize(SETTINGS_PERMISSIONS.MANAGE), updateSetting);

/**
 * @swagger
 * /settings/{key}:
 *   delete:
 *     summary: Delete setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setting deleted
 */
settingsRoutes.delete('/:key', authorize(SETTINGS_PERMISSIONS.MANAGE), deleteSetting);

export { settingsRoutes };
