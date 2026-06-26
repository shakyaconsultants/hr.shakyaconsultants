import { EmployeeTimelineRepository } from '@domain/employee/employee-subresource.schemas.js';
import { EMPLOYEE_TIMELINE_EVENT } from '@domain/employee/employee-subresource.schemas.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

export interface TimelineEntryInput {
  employeeId: string;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export const EmployeeTimelineService = {
  async record(context: EmployeeActorContext, input: TimelineEntryInput): Promise<void> {
    await EmployeeTimelineRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        employeeId: input.employeeId,
        eventType: input.eventType,
        title: input.title,
        description: input.description,
        metadata: input.metadata ?? {},
        occurredAt: input.occurredAt ?? new Date(),
        actorId: context.userId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async list(companyId: string, employeeId: string, limit = 100) {
    const items = await EmployeeTimelineRepository.findMany(
      { employeeId },
      { companyId },
    );
    return items
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit);
  },

  EVENT: EMPLOYEE_TIMELINE_EVENT,
};
