import type { ProjectDocument } from '@domain/project/project.schemas.js';
import { ProjectRepository } from '@domain/project/project.schemas.js';
import { PROJECT_RISK_LEVEL } from '@domain/project/project-extended.schemas.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { UploadService } from '@infrastructure/storage/cloudinary.service.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectEventService } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import { ProjectValidationService } from '@modules/project/services/project-validation.service.js';
import { PROJECT_EVENT } from '@modules/project/services/project-event.service.js';
import type { CreateProjectInput, UpdateProjectInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext, ProjectListQuery } from '@modules/project/types/project.types.js';

export const ProjectService = {
  async getById(companyId: string, id: string): Promise<ProjectDocument> {
    const project = await ProjectRepository.findById(id, { companyId });
    if (!project) {
      throw new NotFoundError('Project not found', ERROR_CODES.NOT_FOUND);
    }
    return project;
  },

  async list(companyId: string, query: ProjectListQuery) {
    const filters: Record<string, unknown>[] = [];
    if (!query.includeArchived) {
      filters.push({ isArchived: false });
    }
    if (query.visibleProjectIds && query.visibleProjectIds.length > 0) {
      filters.push({ id: { $in: query.visibleProjectIds } });
    } else if (query.visibleProjectIds && query.visibleProjectIds.length === 0) {
      return { items: [], pagination: { page: query.page ?? 1, pageSize: query.pageSize ?? 20, total: 0, totalPages: 0 } };
    }
    if (query.status) {
      filters.push({ status: query.status });
    }
    if (query.atRisk) {
      const now = new Date();
      filters.push({
        $or: [
          { riskLevel: { $in: [PROJECT_RISK_LEVEL.HIGH, PROJECT_RISK_LEVEL.CRITICAL] } },
          {
            targetDate: { $exists: true, $ne: null, $lt: now },
            status: { $ne: PROJECT_STATUS.COMPLETED },
          },
        ],
      });
    }
    if (query.priority) {
      filters.push({ priority: query.priority });
    }
    if (query.departmentId) {
      filters.push({ departmentId: query.departmentId });
    }
    if (query.branchId) {
      filters.push({ branchId: query.branchId });
    }
    if (query.projectManagerId) {
      filters.push({ projectManagerId: query.projectManagerId });
    }
    if (query.search) {
      filters.push(buildSearchFilter(query.search, ['name', 'code', 'description', 'clientName']));
    }
    const filter = mergeFilters(...filters);

    return ProjectRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    }, { companyId });
  },

  async create(context: ProjectActorContext, payload: CreateProjectInput): Promise<ProjectDocument> {
    const code = payload.code.toUpperCase();
    await ProjectValidationService.assertUniqueCode(context.companyId, code);
    ProjectValidationService.assertValidDates(payload.startDate, payload.targetDate);

    const id = generateUuid();
    const project = await ProjectRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        code,
        description: payload.description,
        status: payload.status ?? PROJECT_STATUS.PLANNING,
        priority: payload.priority ?? 'medium',
        categoryId: payload.categoryId,
        branchId: payload.branchId,
        departmentId: payload.departmentId,
        startDate: payload.startDate,
        targetDate: payload.targetDate,
        projectManagerId: payload.projectManagerId,
        clientName: payload.clientName,
        budget: payload.budget,
        currency: payload.currency ?? 'INR',
        repositoryUrl: payload.repositoryUrl,
        productionUrl: payload.productionUrl,
        stagingUrl: payload.stagingUrl,
        apiUrl: payload.apiUrl,
        documentationUrl: payload.documentationUrl,
        tags: payload.tags ?? [],
        technologyIds: payload.technologyIds ?? [],
        riskLevel: payload.riskLevel ?? 'low',
        visibility: payload.visibility ?? 'internal',
        isArchived: false,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(project),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await ProjectEventService.emit(context, {
      activityType: ProjectActivityService.TYPES.PROJECT_CREATED,
      activityDescription: `Project ${project.name} (${project.code}) created`,
      entityType: 'project',
      entityId: id,
    });

    return project;
  },

  async update(context: ProjectActorContext, id: string, payload: UpdateProjectInput): Promise<ProjectDocument> {
    const before = await this.getById(context.companyId, id);
    const updatePayload: UpdateProjectInput = { ...payload };
    if (updatePayload.code) {
      await ProjectValidationService.assertUniqueCode(context.companyId, updatePayload.code, id);
      updatePayload.code = updatePayload.code.toUpperCase();
    }

    const updated = await ProjectRepository.update(id, { ...updatePayload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Project not found', ERROR_CODES.NOT_FOUND);
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async archive(context: ProjectActorContext, id: string): Promise<ProjectDocument> {
    const before = await this.getById(context.companyId, id);
    const updated = await ProjectRepository.update(
      id,
      { isArchived: true, status: PROJECT_STATUS.ON_HOLD, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Project not found', ERROR_CODES.NOT_FOUND);
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project',
      entityId: id,
      action: 'archive',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await ProjectEventService.emit(context, {
      activityType: ProjectActivityService.TYPES.PROJECT_ARCHIVED,
      activityDescription: `Project ${updated.name} archived`,
      entityType: 'project',
      entityId: id,
      notification: {
        userId: updated.projectManagerId,
        title: 'Project Archived',
        message: `Project ${updated.name} has been archived`,
        entityType: 'project',
        entityId: id,
        jobName: PROJECT_EVENT.PROJECT_ARCHIVED,
      },
    });

    return updated;
  },

  async restore(context: ProjectActorContext, id: string): Promise<ProjectDocument> {
    const before = await this.getById(context.companyId, id);
    const updated = await ProjectRepository.update(
      id,
      { isArchived: false, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Project not found', ERROR_CODES.NOT_FOUND);
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project',
      entityId: id,
      action: 'restore',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async softDelete(context: ProjectActorContext, id: string): Promise<void> {
    await ProjectValidationService.assertCanDeleteProject(context.companyId, id);
    const before = await this.getById(context.companyId, id);
    await ProjectRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project',
      entityId: id,
      action: 'delete',
      before: ProjectAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async uploadLogo(context: ProjectActorContext, id: string, file: Express.Multer.File): Promise<ProjectDocument> {
    const project = await this.getById(context.companyId, id);
    const upload = await UploadService.uploadImage({
      buffer: file.buffer,
      folder: `projects/${id}/logo`,
      filename: file.originalname,
      mimeType: file.mimetype,
    });

    const updated = await ProjectRepository.update(
      id,
      { logoUrl: upload.secureUrl, logoPublicId: upload.publicId, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    if (!updated) {
      throw new NotFoundError('Project not found', ERROR_CODES.NOT_FOUND);
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project',
      entityId: id,
      action: 'upload',
      before: ProjectAuditService.toRecord(project),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
