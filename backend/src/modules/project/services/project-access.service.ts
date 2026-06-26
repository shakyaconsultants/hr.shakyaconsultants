import { ProjectRepository, ProjectMemberRepository } from '@domain/project/project.schemas.js';
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
};
