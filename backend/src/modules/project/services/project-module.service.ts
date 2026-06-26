import { ProjectModuleRepository, MODULE_STATUS } from '@domain/project/project-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import type { CreateModuleInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const ProjectModuleService = {
  async list(companyId: string, projectId: string) {
    const modules = await ProjectModuleRepository.findMany({ projectId }, { companyId });
    return modules.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async create(context: ProjectActorContext, payload: CreateModuleInput) {
    const id = generateUuid();
    const module = await ProjectModuleRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId: payload.projectId,
        name: payload.name,
        description: payload.description,
        status: payload.status ?? MODULE_STATUS.NOT_STARTED,
        leadId: payload.leadId,
        progressPercent: 0,
        estimatedHours: payload.estimatedHours,
        actualHours: 0,
        dependencyModuleIds: payload.dependencyModuleIds ?? [],
        sortOrder: payload.sortOrder ?? 0,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project_module',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(module),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return module;
  },

  async update(context: ProjectActorContext, id: string, payload: Record<string, unknown>) {
    const before = await ProjectModuleRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Module not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await ProjectModuleRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Module not found', ERROR_CODES.NOT_FOUND);
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project_module',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async softDelete(context: ProjectActorContext, id: string) {
    const before = await ProjectModuleRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Module not found', ERROR_CODES.NOT_FOUND);
    }
    await ProjectModuleRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project_module',
      entityId: id,
      action: 'delete',
      before: ProjectAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
