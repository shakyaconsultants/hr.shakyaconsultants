import {
  ProjectKnowledgeBaseRepository,
  ProjectDocumentFileRepository,
} from '@domain/project/project-extended.schemas.js';
import { encryptField, decryptField } from '@shared/utils/field-encryption.util.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { UploadService } from '@infrastructure/storage/cloudinary.service.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import type { KnowledgeBaseInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const KnowledgeBaseService = {
  async get(companyId: string, projectId: string) {
    const kb = await ProjectKnowledgeBaseRepository.findOne({ projectId }, { companyId });
    if (!kb) {
      return null;
    }
    return {
      ...kb,
      credentials: kb.encryptedCredentials ? decryptField(kb.encryptedCredentials) : undefined,
      envVariables: kb.encryptedEnvVariables ? decryptField(kb.encryptedEnvVariables) : undefined,
      encryptedCredentials: undefined,
      encryptedEnvVariables: undefined,
    };
  },

  async upsert(context: ProjectActorContext, projectId: string, payload: KnowledgeBaseInput) {
    const existing = await ProjectKnowledgeBaseRepository.findOne(
      { projectId },
      { companyId: context.companyId },
    );
    const data: Record<string, unknown> = {
      repositoryUrl: payload.repositoryUrl,
      branches: payload.branches,
      apiDocsUrl: payload.apiDocsUrl,
      swaggerUrl: payload.swaggerUrl,
      deploymentGuide: payload.deploymentGuide,
      architectureNotes: payload.architectureNotes,
      cloudflareEmail: payload.cloudflareEmail,
      devHostingPlatform: payload.devHostingPlatform,
      prodHostingPlatform: payload.prodHostingPlatform,
      documentUrls: payload.documentUrls,
      updatedBy: context.userId,
    };

    if (typeof payload.credentials === 'string') {
      data.encryptedCredentials = encryptField(payload.credentials);
    }
    if (typeof payload.envVariables === 'string') {
      data.encryptedEnvVariables = encryptField(payload.envVariables);
    }

    if (existing) {
      const updated = await ProjectKnowledgeBaseRepository.update(existing.id, data, {
        companyId: context.companyId,
      });
      await ProjectAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'knowledge_base',
        entityId: existing.id,
        action: 'update',
        before: ProjectAuditService.toRecord(existing),
        after: ProjectAuditService.toRecord(updated),
        ip: context.ip,
        userAgent: context.userAgent,
      });
      return updated;
    }

    const id = generateUuid();
    const kb = await ProjectKnowledgeBaseRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId,
        ...data,
        branches: payload.branches ?? [],
        documentUrls: payload.documentUrls ?? [],
        createdBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'knowledge_base',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(kb),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return kb;
  },

  async uploadDocument(context: ProjectActorContext, projectId: string, file: Express.Multer.File) {
    const upload = await UploadService.uploadDocument({
      buffer: file.buffer,
      folder: `projects/${projectId}/documents`,
      filename: file.originalname,
      mimeType: file.mimetype,
    });

    const id = generateUuid();
    const doc = await ProjectDocumentFileRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId,
        fileName: file.originalname,
        fileUrl: upload.secureUrl,
        publicId: upload.publicId,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: context.userId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return doc;
  },

  async listDocuments(companyId: string, projectId: string) {
    return ProjectDocumentFileRepository.findMany({ projectId }, { companyId });
  },
};
