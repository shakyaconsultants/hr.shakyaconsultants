import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import { EmployeeExportService } from '@modules/employee/services/employee-export.service.js';
import {
  EmployeeDashboardService,
  EmployeeDocumentService,
  EmployeeSubresourceService,
} from '@modules/employee/services/employee-profile.service.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';
import { EmployeeLifecycleService } from '@modules/employee/services/employee-lifecycle.service.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { z } from 'zod';
import {
  adminCreateEmployeeSchema,
  assignManagerSchema,
  bankDetailsSchema,
  bulkActionSchema,
  certificationSchema,
  documentUploadMetaSchema,
  educationSchema,
  emergencyContactSchema,
  employeeIdParamSchema,
  experienceSchema,
  idParamSchema,
  importCsvSchema,
  listQuerySchema,
  returnAssetSchema,
  searchQuerySchema,
  signedUploadParamsSchema,
  skillSchema,
  subResourceIdParamSchema,
  updateEmployeeSchema,
  assetSchema,
} from '@modules/employee/validators/employee.validator.js';

function buildActor(req: AuthenticatedRequest): EmployeeActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const listEmployees: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const result = await EmployeeService.list(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const searchEmployees: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { q, limit } = validateInput(searchQuerySchema, req.query);
    const results = await EmployeeService.search(authReq.user.companyId, q, limit);
    return ResponseService.success(res, authReq, results);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const employee = await EmployeeService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const getEmployeeDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const dashboard = await EmployeeDashboardService.getDashboard(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, dashboard);
  } catch (error) {
    next(error);
    return;
  }
};

export const createEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(adminCreateEmployeeSchema, req.body);
    const employee = await EmployeeService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateEmployeeSchema, req.body);
    const employee = await EmployeeService.update(buildActor(authReq), id, payload);
    return ResponseService.success(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const archiveEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const employee = await EmployeeService.archive(buildActor(authReq), id);
    return ResponseService.success(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const restoreEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const employee = await EmployeeService.restore(buildActor(authReq), id);
    return ResponseService.success(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const deactivateEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const employee = await EmployeeService.deactivate(buildActor(authReq), id);
    return ResponseService.success(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const reactivateEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const employee = await EmployeeService.reactivate(buildActor(authReq), id);
    return ResponseService.success(res, authReq, employee);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteEmployee: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await EmployeeService.delete(buildActor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkEmployeeAction: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { ids, action } = validateInput(bulkActionSchema, req.body);
    const result = await EmployeeService.bulkAction(buildActor(authReq), ids, action);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportEmployees: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const result = await EmployeeService.list(authReq.user.companyId, { ...query, pageSize: 10000 });
    const csv = EmployeeExportService.toCsv(result.items);
    await EmployeeExportService.logExport(buildActor(authReq), result.items.length);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const importEmployees: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { content } = validateInput(importCsvSchema, req.body);
    const rows = EmployeeExportService.parseCsv(content);
    const actor = buildActor(authReq);
    const created = [];
    for (const row of rows) {
      if (!row.email || !row.firstName || !row.lastName || !row.departmentId || !row.designationId) {
        continue;
      }
      const employee = await EmployeeService.create(actor, {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        departmentId: row.departmentId,
        designationId: row.designationId,
        branchId: row.branchId,
        joinedAt: row.joinedAt ? new Date(row.joinedAt) : new Date(),
        employmentType: row.employmentType,
      });
      created.push(employee.id);
    }
    return ResponseService.success(res, authReq, { imported: created.length, ids: created });
  } catch (error) {
    next(error);
    return;
  }
};

// Documents
export const listDocuments: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const documents = await EmployeeDocumentService.list(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, documents);
  } catch (error) {
    next(error);
    return;
  }
};

export const uploadDocument: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const body = req.body as { documentType?: string; expiryDate?: string };
    const meta = validateInput(documentUploadMetaSchema, {
      documentType: body.documentType,
      expiryDate: body.expiryDate,
    });
    const file = req.file;
    if (!file) {
      throw new ValidationError('No file uploaded', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    const document = await EmployeeDocumentService.upload(buildActor(authReq), employeeId, {
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      documentType: meta.documentType,
      expiryDate: meta.expiryDate,
    });
    return ResponseService.created(res, authReq, document);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteDocument: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId, id } = validateInput(subResourceIdParamSchema, req.params);
    await EmployeeDocumentService.delete(buildActor(authReq), employeeId, id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const getSignedUploadParams: RequestHandler = (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const { documentType } = validateInput(signedUploadParamsSchema, req.query);
    const params = EmployeeDocumentService.getSignedUploadParams(employeeId, documentType);
    return ResponseService.success(res, authReq, params);
  } catch (error) {
    next(error);
    return;
  }
};

// Sub-resources — generic pattern
function subResourceHandlers(
  listFn: (companyId: string, employeeId: string) => Promise<unknown>,
  createFn: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) => Promise<unknown>,
  schema: z.ZodType<Record<string, unknown>>,
) {
  return {
    list: (async (req, res, next) => {
      try {
        const authReq = req as AuthenticatedRequest;
        const { employeeId } = validateInput(employeeIdParamSchema, req.params);
        const items = await listFn(authReq.user.companyId, employeeId);
        return ResponseService.success(res, authReq, items);
      } catch (error) {
        next(error);
        return;
      }
    }) as RequestHandler,
    create: (async (req, res, next) => {
      try {
        const authReq = req as AuthenticatedRequest;
        const { employeeId } = validateInput(employeeIdParamSchema, req.params);
        const payload = validateInput(schema, req.body);
        const item = await createFn(buildActor(authReq), employeeId, payload);
        return ResponseService.created(res, authReq, item);
      } catch (error) {
        next(error);
        return;
      }
    }) as RequestHandler,
  };
}

export const listEmergencyContacts = subResourceHandlers(
  EmployeeSubresourceService.listEmergencyContacts,
  EmployeeSubresourceService.createEmergencyContact,
  emergencyContactSchema,
).list;

export const createEmergencyContact = subResourceHandlers(
  EmployeeSubresourceService.listEmergencyContacts,
  EmployeeSubresourceService.createEmergencyContact,
  emergencyContactSchema,
).create;

export const listEducation = subResourceHandlers(
  EmployeeSubresourceService.listEducation,
  EmployeeSubresourceService.createEducation,
  educationSchema,
).list;

export const createEducation = subResourceHandlers(
  EmployeeSubresourceService.listEducation,
  EmployeeSubresourceService.createEducation,
  educationSchema,
).create;

export const listExperience = subResourceHandlers(
  EmployeeSubresourceService.listExperience,
  EmployeeSubresourceService.createExperience,
  experienceSchema,
).list;

export const createExperience = subResourceHandlers(
  EmployeeSubresourceService.listExperience,
  EmployeeSubresourceService.createExperience,
  experienceSchema,
).create;

export const listBankDetails = subResourceHandlers(
  EmployeeSubresourceService.listBankDetails,
  EmployeeSubresourceService.createBankDetails,
  bankDetailsSchema,
).list;

export const createBankDetails = subResourceHandlers(
  EmployeeSubresourceService.listBankDetails,
  EmployeeSubresourceService.createBankDetails,
  bankDetailsSchema,
).create;

export const listSkills = subResourceHandlers(
  EmployeeSubresourceService.listSkills,
  EmployeeSubresourceService.createSkill,
  skillSchema,
).list;

export const createSkill = subResourceHandlers(
  EmployeeSubresourceService.listSkills,
  EmployeeSubresourceService.createSkill,
  skillSchema,
).create;

export const listCertifications = subResourceHandlers(
  EmployeeSubresourceService.listCertifications,
  EmployeeSubresourceService.createCertification,
  certificationSchema,
).list;

export const createCertification = subResourceHandlers(
  EmployeeSubresourceService.listCertifications,
  EmployeeSubresourceService.createCertification,
  certificationSchema,
).create;

export const listAssets = subResourceHandlers(
  EmployeeSubresourceService.listAssets,
  EmployeeSubresourceService.createAsset,
  assetSchema,
).list;

export const createAsset = subResourceHandlers(
  EmployeeSubresourceService.listAssets,
  EmployeeSubresourceService.createAsset,
  assetSchema,
).create;

export const returnAsset: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId, id } = validateInput(subResourceIdParamSchema, req.params);
    const { condition } = validateInput(returnAssetSchema, req.body);
    const asset = await EmployeeSubresourceService.returnAsset(buildActor(authReq), employeeId, id, condition);
    return ResponseService.success(res, authReq, asset);
  } catch (error) {
    next(error);
    return;
  }
};

export const listManagers: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const managers = await EmployeeSubresourceService.listManagers(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, managers);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignManager: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const payload = validateInput(assignManagerSchema, req.body);
    const record = await EmployeeSubresourceService.assignManager(buildActor(authReq), employeeId, payload);
    return ResponseService.created(res, authReq, record);
  } catch (error) {
    next(error);
    return;
  }
};

export const endManagerRelationship: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId, id } = validateInput(subResourceIdParamSchema, req.params);
    const record = await EmployeeSubresourceService.endManagerRelationship(buildActor(authReq), employeeId, id);
    return ResponseService.success(res, authReq, record);
  } catch (error) {
    next(error);
    return;
  }
};

export const listTimeline: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const timeline = await EmployeeSubresourceService.listTimeline(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, timeline);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteEducation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId, id } = validateInput(subResourceIdParamSchema, req.params);
    await EmployeeSubresourceService.deleteEducation(buildActor(authReq), employeeId, id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const updateEducation: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId, id } = validateInput(subResourceIdParamSchema, req.params);
    const payload = validateInput(educationSchema.partial(), req.body);
    const record = await EmployeeSubresourceService.updateEducation(buildActor(authReq), employeeId, id, payload);
    return ResponseService.success(res, authReq, record);
  } catch (error) {
    next(error);
    return;
  }
};

export const activateEmployeeAccount: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const result = await EmployeeLifecycleService.sendActivationEmail(buildActor(authReq), employeeId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const sendEmployeeOnboardingEmail: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const result = await EmployeeLifecycleService.sendOnboardingEmail(buildActor(authReq), employeeId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const sendEmployeePasswordResetEmail: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { employeeId } = validateInput(employeeIdParamSchema, req.params);
    const result = await EmployeeLifecycleService.sendPasswordResetEmail(buildActor(authReq), employeeId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};
