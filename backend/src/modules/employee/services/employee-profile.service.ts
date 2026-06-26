import {
  AssetRepository,
  BankDetailsRepository,
  EducationRepository,
  EmergencyContactRepository,
  EmployeeDocumentFileRepository,
  EmployeeRepository,
  ExperienceRepository,
  ReportingHierarchyRepository,
} from '@domain/employee/employee.schemas.js';
import {
  EmployeeCertificationRepository,
  EmployeeSkillRepository,
} from '@domain/employee/employee-subresource.schemas.js';
import { UploadService } from '@infrastructure/storage/cloudinary.service.js';
import { UploadResourceType } from '@shared/enums/index.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { EmployeeAuditService } from '@modules/employee/services/employee-audit.service.js';
import { EmployeeTimelineService } from '@modules/employee/services/employee-timeline.service.js';
import { EmployeeValidationService } from '@modules/employee/services/employee-validation.service.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import type { EmployeeActorContext, EmployeeDashboardData } from '@modules/employee/types/employee.types.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

function toRecords(items: BaseDocument[]): Record<string, unknown>[] {
  return items.map((item) => EmployeeAuditService.toRecord(item));
}

export const EmployeeDashboardService = {
  async getDashboard(companyId: string, employeeId: string): Promise<EmployeeDashboardData> {
    await EmployeeValidationService.assertEmployeeExists(companyId, employeeId);

    const [
      employee,
      emergencyContacts,
      bankDetails,
      documents,
      education,
      experience,
      skills,
      certifications,
      assets,
      timeline,
      managers,
    ] = await Promise.all([
      EmployeeService.getById(companyId, employeeId),
      EmergencyContactRepository.findMany({ employeeId }, { companyId }),
      BankDetailsRepository.findMany({ employeeId }, { companyId }),
      EmployeeDocumentFileRepository.findMany({ employeeId, isLatest: true }, { companyId }),
      EducationRepository.findMany({ employeeId }, { companyId }),
      ExperienceRepository.findMany({ employeeId }, { companyId }),
      EmployeeSkillRepository.findMany({ employeeId }, { companyId }),
      EmployeeCertificationRepository.findMany({ employeeId }, { companyId }),
      AssetRepository.findMany({ employeeId }, { companyId }),
      EmployeeTimelineService.list(companyId, employeeId),
      ReportingHierarchyRepository.findMany({ employeeId, effectiveTo: null }, { companyId }),
    ]);

    return {
      employee: EmployeeAuditService.toRecord(employee),
      emergencyContacts: toRecords(emergencyContacts),
      bankDetails: toRecords(bankDetails),
      documents: toRecords(documents),
      education: toRecords(education),
      experience: toRecords(experience),
      skills: toRecords(skills),
      certifications: toRecords(certifications),
      assets: toRecords(assets),
      timeline: toRecords(timeline),
      managers: toRecords(managers),
    };
  },
};

export const EmployeeDocumentService = {
  async list(companyId: string, employeeId: string) {
    await EmployeeValidationService.assertEmployeeExists(companyId, employeeId);
    return EmployeeDocumentFileRepository.findMany({ employeeId }, { companyId });
  },

  async upload(
    context: EmployeeActorContext,
    employeeId: string,
    input: { buffer: Buffer; filename: string; mimeType: string; documentType: string; expiryDate?: Date },
  ) {
    await EmployeeValidationService.assertEmployeeExists(context.companyId, employeeId);

    const existing = await EmployeeDocumentFileRepository.findMany(
      { employeeId, documentType: input.documentType, isLatest: true },
      { companyId: context.companyId },
    );

    for (const doc of existing) {
      await EmployeeDocumentFileRepository.update(
        doc.id,
        { isLatest: false, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    const nextVersion = existing.length > 0 ? Math.max(...existing.map((d) => d.version)) + 1 : 1;
    const folder = `employees/${employeeId}/documents/${input.documentType}`;
    const isImage = input.mimeType.startsWith('image/');
    const upload = isImage
      ? await UploadService.uploadImage({ buffer: input.buffer, folder, filename: input.filename, mimeType: input.mimeType })
      : await UploadService.uploadDocument({ buffer: input.buffer, folder, filename: input.filename, mimeType: input.mimeType });

    const id = generateUuid();
    const document = await EmployeeDocumentFileRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId,
        documentType: input.documentType,
        fileName: input.filename,
        fileUrl: upload.secureUrl,
        publicId: upload.publicId,
        mimeType: input.mimeType,
        fileSize: upload.bytes,
        version: nextVersion,
        isLatest: true,
        expiryDate: input.expiryDate,
        uploadedBy: context.userId,
        verificationStatus: 'pending',
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (input.documentType === 'profile_photo') {
      await EmployeeRepository.update(
        employeeId,
        { photoUrl: upload.secureUrl, photoPublicId: upload.publicId, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    await EmployeeTimelineService.record(context, {
      employeeId,
      eventType: EmployeeTimelineService.EVENT.DOCUMENT_UPLOAD,
      title: `Document uploaded: ${input.documentType}`,
      metadata: { documentId: id, version: nextVersion },
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_document',
      entityId: id,
      action: 'upload',
      after: EmployeeAuditService.toRecord(document),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return document;
  },

  async delete(context: EmployeeActorContext, employeeId: string, documentId: string): Promise<void> {
    const document = await EmployeeDocumentFileRepository.findById(documentId, { companyId: context.companyId });
    if (!document || document.employeeId !== employeeId) {
      throw new NotFoundError('Document not found', ERROR_CODES.NOT_FOUND);
    }

    await UploadService.delete(document.publicId, UploadResourceType.Auto);
    await EmployeeDocumentFileRepository.softDelete(documentId, context.userId, {
      companyId: context.companyId,
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_document',
      entityId: documentId,
      action: 'delete',
      before: EmployeeAuditService.toRecord(document),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  getSignedUploadParams(employeeId: string, documentType: string) {
    const folder = `employees/${employeeId}/documents/${documentType}`;
    return UploadService.createSignedUploadParams(folder);
  },
};

async function createSubResource(
  context: EmployeeActorContext,
  employeeId: string,
  entityType: string,
  repository: {
    create: (data: Record<string, unknown>, options?: { companyId: string }) => Promise<BaseDocument>;
  },
  payload: Record<string, unknown>,
): Promise<BaseDocument> {
  await EmployeeValidationService.assertEmployeeExists(context.companyId, employeeId);
  const id = generateUuid();
  const record = await repository.create(
    {
      id,
      companyId: context.companyId,
      employeeId,
      ...payload,
      createdBy: context.userId,
      updatedBy: context.userId,
    },
    { companyId: context.companyId },
  );

  await EmployeeAuditService.log({
    companyId: context.companyId,
    userId: context.userId,
    entityType,
    entityId: id,
    action: 'create',
    after: EmployeeAuditService.toRecord(record),
    ip: context.ip,
    userAgent: context.userAgent,
  });

  return record;
}

export const EmployeeSubresourceService = {
  // Emergency contacts
  listEmergencyContacts: (companyId: string, employeeId: string) =>
    EmergencyContactRepository.findMany({ employeeId }, { companyId }),

  createEmergencyContact: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'emergency_contact', EmergencyContactRepository, payload),

  // Education
  listEducation: (companyId: string, employeeId: string) =>
    EducationRepository.findMany({ employeeId }, { companyId }),

  createEducation: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'education', EducationRepository, payload),

  updateEducation: async (ctx: EmployeeActorContext, employeeId: string, id: string, payload: Record<string, unknown>) => {
    const before = await EducationRepository.findById(id, { companyId: ctx.companyId });
    if (!before || before.employeeId !== employeeId) {
      throw new NotFoundError('Education record not found', ERROR_CODES.NOT_FOUND);
    }
    const updated = await EducationRepository.update(id, { ...payload, updatedBy: ctx.userId }, { companyId: ctx.companyId });
    if (!updated) {
      throw new NotFoundError('Education record not found', ERROR_CODES.NOT_FOUND);
    }
    await EmployeeAuditService.log({ companyId: ctx.companyId, userId: ctx.userId, entityType: 'education', entityId: id, action: 'update', before: EmployeeAuditService.toRecord(before), after: EmployeeAuditService.toRecord(updated), ip: ctx.ip, userAgent: ctx.userAgent });
    return updated;
  },

  deleteEducation: async (ctx: EmployeeActorContext, employeeId: string, id: string) => {
    const before = await EducationRepository.findById(id, { companyId: ctx.companyId });
    if (!before || before.employeeId !== employeeId) {
      throw new NotFoundError('Education record not found', ERROR_CODES.NOT_FOUND);
    }
    await EducationRepository.softDelete(id, ctx.userId, { companyId: ctx.companyId });
    await EmployeeAuditService.log({ companyId: ctx.companyId, userId: ctx.userId, entityType: 'education', entityId: id, action: 'delete', before: EmployeeAuditService.toRecord(before), ip: ctx.ip, userAgent: ctx.userAgent });
  },

  // Experience
  listExperience: (companyId: string, employeeId: string) =>
    ExperienceRepository.findMany({ employeeId }, { companyId }),

  createExperience: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'experience', ExperienceRepository, payload),

  // Bank details
  listBankDetails: (companyId: string, employeeId: string) =>
    BankDetailsRepository.findMany({ employeeId }, { companyId }),

  createBankDetails: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'bank_details', BankDetailsRepository, { verificationStatus: 'pending', ...payload }),

  // Skills
  listSkills: (companyId: string, employeeId: string) =>
    EmployeeSkillRepository.findMany({ employeeId }, { companyId }),

  createSkill: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'employee_skill', EmployeeSkillRepository, payload),

  // Certifications
  listCertifications: (companyId: string, employeeId: string) =>
    EmployeeCertificationRepository.findMany({ employeeId }, { companyId }),

  createCertification: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'employee_certification', EmployeeCertificationRepository, payload),

  // Assets
  listAssets: (companyId: string, employeeId: string) =>
    AssetRepository.findMany({ employeeId }, { companyId }),

  createAsset: (ctx: EmployeeActorContext, employeeId: string, payload: Record<string, unknown>) =>
    createSubResource(ctx, employeeId, 'asset', AssetRepository, payload),

  returnAsset: async (ctx: EmployeeActorContext, employeeId: string, id: string, condition?: string) => {
    const before = await AssetRepository.findById(id, { companyId: ctx.companyId });
    if (!before || before.employeeId !== employeeId) {
      throw new NotFoundError('Asset not found', ERROR_CODES.NOT_FOUND);
    }
    const updated = await AssetRepository.update(
      id,
      { returnedAt: new Date(), status: 'returned', condition, updatedBy: ctx.userId },
      { companyId: ctx.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Asset not found', ERROR_CODES.NOT_FOUND);
    }
    await EmployeeAuditService.log({ companyId: ctx.companyId, userId: ctx.userId, entityType: 'asset', entityId: id, action: 'update', before: EmployeeAuditService.toRecord(before), after: EmployeeAuditService.toRecord(updated), ip: ctx.ip, userAgent: ctx.userAgent });
    return updated;
  },

  // Manager relationships
  listManagers: (companyId: string, employeeId: string) =>
    ReportingHierarchyRepository.findMany({ employeeId, effectiveTo: null }, { companyId }),

  assignManager: async (
    ctx: EmployeeActorContext,
    employeeId: string,
    payload: { managerId: string; relationshipType: string; isPrimary?: boolean },
  ) => {
    await EmployeeValidationService.assertEmployeeExists(ctx.companyId, employeeId);
    await EmployeeValidationService.assertManagerExists(ctx.companyId, payload.managerId);
    await EmployeeValidationService.assertNoManagerLoop(ctx.companyId, employeeId, payload.managerId);
    await EmployeeValidationService.assertNoDuplicateRelationship(
      ctx.companyId,
      employeeId,
      payload.managerId,
      payload.relationshipType,
    );

    const id = generateUuid();
    const record = await ReportingHierarchyRepository.create(
      {
        id,
        companyId: ctx.companyId,
        employeeId,
        managerId: payload.managerId,
        relationshipType: payload.relationshipType,
        effectiveFrom: new Date(),
        isPrimary: payload.isPrimary ?? false,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      },
      { companyId: ctx.companyId },
    );

    if (payload.relationshipType === 'direct' || payload.isPrimary) {
      await EmployeeRepository.update(
        employeeId,
        { reportingManagerId: payload.managerId, updatedBy: ctx.userId },
        { companyId: ctx.companyId },
      );
    }
    if (payload.relationshipType === 'dotted_line') {
      await EmployeeRepository.update(
        employeeId,
        { dottedManagerId: payload.managerId, updatedBy: ctx.userId },
        { companyId: ctx.companyId },
      );
    }

    await EmployeeTimelineService.record(ctx, {
      employeeId,
      eventType: EmployeeTimelineService.EVENT.MANAGER_CHANGE,
      title: `Manager assigned (${payload.relationshipType})`,
      metadata: { managerId: payload.managerId },
    });

    await EmployeeAuditService.log({
      companyId: ctx.companyId,
      userId: ctx.userId,
      entityType: 'reporting_hierarchy',
      entityId: id,
      action: 'assign',
      after: EmployeeAuditService.toRecord(record),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return record;
  },

  endManagerRelationship: async (ctx: EmployeeActorContext, employeeId: string, relationshipId: string) => {
    const before = await ReportingHierarchyRepository.findById(relationshipId, { companyId: ctx.companyId });
    if (!before || before.employeeId !== employeeId) {
      throw new NotFoundError('Manager relationship not found', ERROR_CODES.NOT_FOUND);
    }
    const updated = await ReportingHierarchyRepository.update(
      relationshipId,
      { effectiveTo: new Date(), updatedBy: ctx.userId },
      { companyId: ctx.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Manager relationship not found', ERROR_CODES.NOT_FOUND);
    }
    await EmployeeAuditService.log({
      companyId: ctx.companyId,
      userId: ctx.userId,
      entityType: 'reporting_hierarchy',
      entityId: relationshipId,
      action: 'revoke',
      before: EmployeeAuditService.toRecord(before),
      after: EmployeeAuditService.toRecord(updated),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return updated;
  },

  listTimeline: (companyId: string, employeeId: string) =>
    EmployeeTimelineService.list(companyId, employeeId),
};
