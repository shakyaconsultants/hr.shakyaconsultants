import { ProjectRepository, ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { PROJECT_MEMBER_ROLE } from '@domain/project/project-extended.schemas.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const ProjectAccessService = {
  async resolveAssignedProjectIds(context: ProjectActorContext): Promise<string[]> {
    if (!context.employeeId) {
      return [];
    }

    const [memberships, managedProjects] = await Promise.all([
      ProjectMemberRepository.findMany({ employeeId: context.employeeId }, { companyId: context.companyId }),
      ProjectRepository.findMany({ projectManagerId: context.employeeId, isArchived: false }, { companyId: context.companyId }),
    ]);

    const activeMembershipProjectIds = memberships
      .filter((member) => !member.leftAt)
      .map((member) => member.projectId);

    const managedProjectIds = managedProjects.map((project) => project.id);

    return [...new Set([...activeMembershipProjectIds, ...managedProjectIds])];
  },

  async assertProjectManagerAccess(context: ProjectActorContext, projectId: string): Promise<void> {
    const project = await ProjectRepository.findById(projectId, { companyId: context.companyId });
    if (!project) {
      throw new NotFoundError('Project not found', ERROR_CODES.NOT_FOUND);
    }

    if (!context.employeeId) {
      throw new ForbiddenError('Employee context required for project management', ERROR_CODES.AUTH_FORBIDDEN);
    }

    if (project.projectManagerId === context.employeeId) {
      return;
    }

    const membership = await ProjectMemberRepository.findOne(
      { projectId, employeeId: context.employeeId },
      { companyId: context.companyId },
    );

    if (
      membership
      && !membership.leftAt
      && (membership.role === PROJECT_MEMBER_ROLE.PROJECT_MANAGER
        || membership.role === PROJECT_MEMBER_ROLE.ASSISTANT_PROJECT_MANAGER)
    ) {
      return;
    }

    throw new ForbiddenError('You do not have permission to manage this project', ERROR_CODES.AUTH_FORBIDDEN);
  },

  async assertProjectViewAccess(context: ProjectActorContext, projectId: string): Promise<void> {
    const assignedIds = await this.resolveAssignedProjectIds(context);
    if (assignedIds.includes(projectId)) {
      return;
    }
    throw new ForbiddenError('You do not have access to this project', ERROR_CODES.AUTH_FORBIDDEN);
  },
};
