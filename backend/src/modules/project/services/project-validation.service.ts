import { ProjectRepository } from '@domain/project/project.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { SprintRepository } from '@domain/project/project.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export const ProjectValidationService = {
  async assertUniqueCode(companyId: string, code: string, excludeId?: string): Promise<void> {
    const existing = await ProjectRepository.findOne({ code: code.toUpperCase() }, { companyId });
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('Project code already exists', ERROR_CODES.CONFLICT);
    }
  },

  assertValidDates(startDate?: Date, targetDate?: Date, endDate?: Date): void {
    if (startDate && targetDate && targetDate < startDate) {
      throw new ValidationError('Target date cannot be before start date', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    if (startDate && endDate && endDate < startDate) {
      throw new ValidationError('End date cannot be before start date', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    if (targetDate && endDate && endDate < targetDate) {
      throw new ValidationError('End date cannot be before target date', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
  },

  assertDueDateNotPast(dueDate: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      throw new ValidationError('Due date cannot be in the past', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
  },

  async assertCanDeleteProject(companyId: string, projectId: string): Promise<void> {
    const project = await ProjectRepository.findById(projectId, { companyId });
    if (!project) {
      return;
    }
    if (project.status === PROJECT_STATUS.ACTIVE) {
      throw new ValidationError('Cannot delete an active project. Archive it first.', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
  },

  async assertNoCircularTaskDependency(
    companyId: string,
    taskId: string,
    dependencyTaskIds: string[],
  ): Promise<void> {
    if (dependencyTaskIds.includes(taskId)) {
      throw new ValidationError('Task cannot depend on itself', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const visited = new Set<string>([taskId]);
    const queue = [...dependencyTaskIds];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }
      if (visited.has(currentId)) {
        throw new ValidationError('Circular task dependency detected', [], { code: ERROR_CODES.VALIDATION_FAILED });
      }
      visited.add(currentId);
      const task = await TaskRepository.findById(currentId, { companyId });
      if (task && task.dependencyTaskIds.length > 0) {
        queue.push(...task.dependencyTaskIds);
      }
    }
  },

  async assertValidSprintDates(
    companyId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
    excludeSprintId?: string,
  ): Promise<void> {
    if (endDate <= startDate) {
      throw new ValidationError('Sprint end date must be after start date', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const overlapping = await SprintRepository.findMany({ projectId }, { companyId });
    for (const sprint of overlapping) {
      if (sprint.id === excludeSprintId) {
        continue;
      }
      const overlaps = startDate <= sprint.endDate && endDate >= sprint.startDate;
      if (overlaps && sprint.status !== 'cancelled') {
        throw new ValidationError('Sprint dates overlap with an existing sprint', [], { code: ERROR_CODES.VALIDATION_FAILED });
      }
    }
  },

  async assertValidVerifier(companyId: string, projectId: string, verifierId: string): Promise<void> {
    const project = await ProjectRepository.findById(projectId, { companyId });
    if (project?.projectManagerId === verifierId) {
      return;
    }

    const member = await ProjectMemberRepository.findOne(
      { projectId, employeeId: verifierId },
      { companyId },
    );
    if (!member) {
      throw new ValidationError('Verifier must be a project manager or member', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
  },

  assertTaskCanBeVerified(status: string): void {
    if (status !== PROJECT_TASK_STATUS.COMPLETED) {
      throw new ValidationError('Only completed tasks can be verified', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
  },
};
