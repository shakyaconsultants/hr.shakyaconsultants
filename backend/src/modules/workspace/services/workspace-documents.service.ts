import { EmployeeDocumentFileRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { WorkspaceAuditService } from '@modules/workspace/services/workspace-audit.service.js';
import { WorkspaceActivityService } from '@modules/workspace/services/workspace-activity.service.js';
import type { WorkspaceActorContext, WorkspaceListQuery } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceDocumentsService = {
  async list(context: WorkspaceActorContext, query: WorkspaceListQuery) {
    const documents = await EmployeeDocumentFileRepository.findMany(
      { employeeId: context.employeeId, isLatest: true },
      { companyId: context.companyId },
    );

    let filtered = documents;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = documents.filter(
        (d) => d.fileName.toLowerCase().includes(term) || d.documentType.toLowerCase().includes(term),
      );
    }

    const now = new Date();
    const enriched = filtered.map((doc) => ({
      ...WorkspaceAuditService.toRecord(doc),
      isExpired: doc.expiryDate ? new Date(doc.expiryDate) < now : false,
      expiresSoon: doc.expiryDate
        ? new Date(doc.expiryDate) >= now && new Date(doc.expiryDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : false,
    }));

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;

    return {
      items: enriched.slice(start, start + pageSize),
      total: enriched.length,
      page,
      pageSize,
    };
  },

  async getById(context: WorkspaceActorContext, documentId: string) {
    const document = await EmployeeDocumentFileRepository.findById(documentId, { companyId: context.companyId });
    if (!document || document.employeeId !== context.employeeId) {
      throw new NotFoundError('Document not found', ERROR_CODES.NOT_FOUND);
    }

    const versions = await EmployeeDocumentFileRepository.findMany(
      { employeeId: context.employeeId, documentType: document.documentType },
      { companyId: context.companyId },
    );

    await WorkspaceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_document',
      entityId: documentId,
      action: 'read',
      after: { documentType: document.documentType, fileName: document.fileName },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return {
      document: WorkspaceAuditService.toRecord(document),
      versions: versions.sort((a, b) => b.version - a.version).map(WorkspaceAuditService.toRecord),
    };
  },

  async recordDownload(context: WorkspaceActorContext, documentId: string) {
    const document = await EmployeeDocumentFileRepository.findById(documentId, { companyId: context.companyId });
    if (!document || document.employeeId !== context.employeeId) {
      throw new NotFoundError('Document not found', ERROR_CODES.NOT_FOUND);
    }

    await WorkspaceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee_document',
      entityId: documentId,
      action: 'download',
      after: { documentType: document.documentType, fileName: document.fileName, fileUrl: document.fileUrl },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await WorkspaceActivityService.publish(context, {
      activityType: WorkspaceActivityService.TYPES.DOCUMENT_DOWNLOADED,
      description: `Document downloaded: ${document.fileName}`,
      entityType: 'employee_document',
      entityId: documentId,
    });

    return {
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  },
};
