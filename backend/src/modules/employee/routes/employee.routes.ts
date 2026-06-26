import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { uploadMiddleware } from '@config/upload.config.js';
import { EMPLOYEE_PERMISSIONS } from '@modules/employee/constants/employee-permissions.constants.js';
import {
  activateEmployeeAccount,
  archiveEmployee,
  assignManager,
  bulkEmployeeAction,
  createAsset,
  createBankDetails,
  createCertification,
  createEducation,
  createEmergencyContact,
  createEmployee,
  createExperience,
  createSkill,
  deactivateEmployee,
  deleteDocument,
  deleteEducation,
  deleteEmployee,
  endManagerRelationship,
  exportEmployees,
  getEmployee,
  getEmployeeDashboard,
  getSignedUploadParams,
  importEmployees,
  listAssets,
  listBankDetails,
  listCertifications,
  listDocuments,
  listEducation,
  listEmergencyContacts,
  listEmployees,
  listExperience,
  listManagers,
  listSkills,
  listTimeline,
  reactivateEmployee,
  restoreEmployee,
  returnAsset,
  searchEmployees,
  updateEducation,
  updateEmployee,
  uploadDocument,
} from '@modules/employee/controllers/employee.controller.js';

const employeeRoutes = Router();

employeeRoutes.use(authenticateMiddleware);
employeeRoutes.use(companyScopeMiddleware());

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
employeeRoutes.get('/', authorize(EMPLOYEE_PERMISSIONS.READ), listEmployees);
employeeRoutes.get('/search', authorize(EMPLOYEE_PERMISSIONS.READ), searchEmployees);
employeeRoutes.get('/export', authorize(EMPLOYEE_PERMISSIONS.EXPORT), exportEmployees);
employeeRoutes.post('/import', authorize(EMPLOYEE_PERMISSIONS.IMPORT), importEmployees);
employeeRoutes.post('/bulk', authorize(EMPLOYEE_PERMISSIONS.BULK), bulkEmployeeAction);
employeeRoutes.post('/', authorize(EMPLOYEE_PERMISSIONS.CREATE), createEmployee);
employeeRoutes.get('/:id/dashboard', authorize(EMPLOYEE_PERMISSIONS.READ), getEmployeeDashboard);
employeeRoutes.get('/:id', authorize(EMPLOYEE_PERMISSIONS.READ), getEmployee);
employeeRoutes.patch('/:id', authorize(EMPLOYEE_PERMISSIONS.UPDATE), updateEmployee);
employeeRoutes.delete('/:id', authorize(EMPLOYEE_PERMISSIONS.DELETE), deleteEmployee);
employeeRoutes.post('/:id/archive', authorize(EMPLOYEE_PERMISSIONS.UPDATE), archiveEmployee);
employeeRoutes.post('/:id/restore', authorize(EMPLOYEE_PERMISSIONS.UPDATE), restoreEmployee);
employeeRoutes.post('/:id/deactivate', authorize(EMPLOYEE_PERMISSIONS.UPDATE), deactivateEmployee);
employeeRoutes.post('/:employeeId/activate-account', authorize(EMPLOYEE_PERMISSIONS.UPDATE), activateEmployeeAccount);
employeeRoutes.post('/:id/reactivate', authorize(EMPLOYEE_PERMISSIONS.UPDATE), reactivateEmployee);

employeeRoutes.get('/:employeeId/documents', authorize(EMPLOYEE_PERMISSIONS.DOCUMENTS_READ), listDocuments);
employeeRoutes.post(
  '/:employeeId/documents',
  authorize(EMPLOYEE_PERMISSIONS.DOCUMENTS_MANAGE),
  uploadMiddleware.single('file'),
  uploadDocument,
);
employeeRoutes.delete('/:employeeId/documents/:id', authorize(EMPLOYEE_PERMISSIONS.DOCUMENTS_MANAGE), deleteDocument);
employeeRoutes.get('/:employeeId/upload/signed-params', authorize(EMPLOYEE_PERMISSIONS.DOCUMENTS_MANAGE), getSignedUploadParams);

employeeRoutes.get('/:employeeId/emergency-contacts', authorize(EMPLOYEE_PERMISSIONS.READ), listEmergencyContacts);
employeeRoutes.post('/:employeeId/emergency-contacts', authorize(EMPLOYEE_PERMISSIONS.UPDATE), createEmergencyContact);

employeeRoutes.get('/:employeeId/education', authorize(EMPLOYEE_PERMISSIONS.EDUCATION_READ), listEducation);
employeeRoutes.post('/:employeeId/education', authorize(EMPLOYEE_PERMISSIONS.EDUCATION_MANAGE), createEducation);
employeeRoutes.patch('/:employeeId/education/:id', authorize(EMPLOYEE_PERMISSIONS.EDUCATION_MANAGE), updateEducation);
employeeRoutes.delete('/:employeeId/education/:id', authorize(EMPLOYEE_PERMISSIONS.EDUCATION_MANAGE), deleteEducation);

employeeRoutes.get('/:employeeId/experience', authorize(EMPLOYEE_PERMISSIONS.EXPERIENCE_READ), listExperience);
employeeRoutes.post('/:employeeId/experience', authorize(EMPLOYEE_PERMISSIONS.EXPERIENCE_MANAGE), createExperience);

employeeRoutes.get('/:employeeId/bank-details', authorize(EMPLOYEE_PERMISSIONS.BANK_READ), listBankDetails);
employeeRoutes.post('/:employeeId/bank-details', authorize(EMPLOYEE_PERMISSIONS.BANK_MANAGE), createBankDetails);

employeeRoutes.get('/:employeeId/skills', authorize(EMPLOYEE_PERMISSIONS.SKILLS_READ), listSkills);
employeeRoutes.post('/:employeeId/skills', authorize(EMPLOYEE_PERMISSIONS.SKILLS_MANAGE), createSkill);

employeeRoutes.get('/:employeeId/certifications', authorize(EMPLOYEE_PERMISSIONS.CERTIFICATIONS_READ), listCertifications);
employeeRoutes.post('/:employeeId/certifications', authorize(EMPLOYEE_PERMISSIONS.CERTIFICATIONS_MANAGE), createCertification);

employeeRoutes.get('/:employeeId/assets', authorize(EMPLOYEE_PERMISSIONS.ASSETS_READ), listAssets);
employeeRoutes.post('/:employeeId/assets', authorize(EMPLOYEE_PERMISSIONS.ASSETS_MANAGE), createAsset);
employeeRoutes.post('/:employeeId/assets/:id/return', authorize(EMPLOYEE_PERMISSIONS.ASSETS_MANAGE), returnAsset);

employeeRoutes.get('/:employeeId/managers', authorize(EMPLOYEE_PERMISSIONS.MANAGERS_READ), listManagers);
employeeRoutes.post('/:employeeId/managers', authorize(EMPLOYEE_PERMISSIONS.MANAGERS_MANAGE), assignManager);
employeeRoutes.delete('/:employeeId/managers/:id', authorize(EMPLOYEE_PERMISSIONS.MANAGERS_MANAGE), endManagerRelationship);
employeeRoutes.get('/:employeeId/timeline', authorize(EMPLOYEE_PERMISSIONS.TIMELINE_READ), listTimeline);

export { employeeRoutes };
