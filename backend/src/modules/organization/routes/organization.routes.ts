import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { authorize } from '@modules/auth/middleware/authorize.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { ORGANIZATION_ROUTES } from '@modules/organization/constants/organization.constants.js';
import { ORG_PERMISSIONS } from '@modules/organization/constants/organization-permissions.constants.js';
import { authorizeEntity } from '@modules/organization/middleware/entity-authorize.middleware.js';
import {
  bulkCreateEntities,
  bulkDeleteEntities,
  bulkUpdateEntities,
  createEntity,
  deleteEntity,
  exportEntities,
  getCompany,
  getEntityById,
  importEntities,
  listEntities,
  restoreEntity,
  updateCompany,
  updateEntity,
} from '@modules/organization/controllers/master-data.controller.js';

const organizationRoutes = Router();

organizationRoutes.use(authenticateMiddleware);
organizationRoutes.use(companyScopeMiddleware());

/**
 * @swagger
 * /organization/company:
 *   get:
 *     summary: Get current company profile
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile
 */
organizationRoutes.get(
  ORGANIZATION_ROUTES.COMPANY,
  authorize(ORG_PERMISSIONS.COMPANY_READ),
  getCompany,
);

/**
 * @swagger
 * /organization/company:
 *   patch:
 *     summary: Update current company profile
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Company updated
 */
organizationRoutes.patch(
  ORGANIZATION_ROUTES.COMPANY,
  authorize(ORG_PERMISSIONS.COMPANY_UPDATE),
  updateCompany,
);

/**
 * @swagger
 * /organization/entities/{entityKey}:
 *   get:
 *     summary: List master data entities
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityKey
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: useCursor
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated entity list
 */
organizationRoutes.get(
  `${ORGANIZATION_ROUTES.ENTITIES}/:entityKey`,
  authorizeEntity('read'),
  listEntities,
);

/**
 * @swagger
 * /organization/entities/{entityKey}/{id}:
 *   get:
 *     summary: Get master data entity by ID
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityKey
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Entity details
 */
organizationRoutes.get(
  `${ORGANIZATION_ROUTES.ENTITIES}/:entityKey/:id`,
  authorizeEntity('read'),
  getEntityById,
);

/**
 * @swagger
 * /organization/entities/{entityKey}:
 *   post:
 *     summary: Create master data entity
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Entity created
 */
organizationRoutes.post(
  `${ORGANIZATION_ROUTES.ENTITIES}/:entityKey`,
  authorizeEntity('create'),
  createEntity,
);

/**
 * @swagger
 * /organization/entities/{entityKey}/{id}:
 *   patch:
 *     summary: Update master data entity
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Entity updated
 */
organizationRoutes.patch(
  `${ORGANIZATION_ROUTES.ENTITIES}/:entityKey/:id`,
  authorizeEntity('update'),
  updateEntity,
);

/**
 * @swagger
 * /organization/entities/{entityKey}/{id}:
 *   delete:
 *     summary: Soft delete master data entity
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Entity deleted
 */
organizationRoutes.delete(
  `${ORGANIZATION_ROUTES.ENTITIES}/:entityKey/:id`,
  authorizeEntity('delete'),
  deleteEntity,
);

/**
 * @swagger
 * /organization/entities/{entityKey}/{id}/restore:
 *   post:
 *     summary: Restore soft-deleted entity
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Entity restored
 */
organizationRoutes.post(
  `${ORGANIZATION_ROUTES.ENTITIES}/:entityKey/:id/restore`,
  authorizeEntity('update'),
  restoreEntity,
);

/**
 * @swagger
 * /organization/bulk/{entityKey}:
 *   post:
 *     summary: Bulk create entities
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Entities created
 */
organizationRoutes.post(
  `${ORGANIZATION_ROUTES.BULK}/:entityKey`,
  authorize(ORG_PERMISSIONS.BULK_MANAGE),
  bulkCreateEntities,
);

/**
 * @swagger
 * /organization/bulk/{entityKey}:
 *   patch:
 *     summary: Bulk update entities
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Entities updated
 */
organizationRoutes.patch(
  `${ORGANIZATION_ROUTES.BULK}/:entityKey`,
  authorize(ORG_PERMISSIONS.BULK_MANAGE),
  bulkUpdateEntities,
);

/**
 * @swagger
 * /organization/bulk/{entityKey}:
 *   delete:
 *     summary: Bulk delete entities
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Entities deleted
 */
organizationRoutes.delete(
  `${ORGANIZATION_ROUTES.BULK}/:entityKey`,
  authorize(ORG_PERMISSIONS.BULK_MANAGE),
  bulkDeleteEntities,
);

/**
 * @swagger
 * /organization/export/{entityKey}:
 *   get:
 *     summary: Export entities as CSV
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
organizationRoutes.get(
  `${ORGANIZATION_ROUTES.EXPORT}/:entityKey`,
  authorize(ORG_PERMISSIONS.EXPORT),
  exportEntities,
);

/**
 * @swagger
 * /organization/import/{entityKey}:
 *   post:
 *     summary: Import entities from CSV
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *     responses:
 *       201:
 *         description: Import completed
 */
organizationRoutes.post(
  `${ORGANIZATION_ROUTES.IMPORT}/:entityKey`,
  authorize(ORG_PERMISSIONS.IMPORT),
  importEntities,
);

export { organizationRoutes };
