import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { HolidayResolverService } from '@modules/organization/services/holiday-resolver.service.js';
import { InterviewRepository } from '@domain/recruitment/recruitment.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import type { WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceCalendarService = {
  async getEvents(context: WorkspaceActorContext, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const employee = await EmployeeRepository.findById(context.employeeId, {
      companyId: context.companyId,
    });
    const holidayScope = {
      branchId: employee?.branchId,
      departmentId: employee?.departmentId,
    };

    const [tasks, holidays, interviews, employees] = await Promise.all([
      TaskRepository.findMany(
        { assigneeId: context.employeeId, dueDate: { $gte: start, $lte: end } },
        { companyId: context.companyId },
      ),
      HolidayResolverService.listHolidaysInRange(context.companyId, start, end, holidayScope),
      InterviewRepository.findMany(
        { interviewerIds: context.employeeId, scheduledAt: { $gte: start, $lte: end } },
        { companyId: context.companyId },
      ),
      EmployeeRepository.findMany(
        { status: ENTITY_STATUS.ACTIVE },
        { companyId: context.companyId },
      ),
    ]);

    const events: Record<string, unknown>[] = [];

    for (const task of tasks) {
      events.push({
        id: task.id,
        type: 'task_deadline',
        title: task.title,
        date: task.dueDate,
        projectId: task.projectId,
        status: task.status,
      });
    }

    for (const holiday of holidays) {
      events.push({
        id: holiday.id,
        type: 'holiday',
        title: holiday.name,
        date: holiday.date,
      });
    }

    for (const interview of interviews) {
      events.push({
        id: interview.id,
        type: 'interview',
        title: `Interview — Round ${String(interview.round)}`,
        date: interview.scheduledAt,
        status: interview.status,
      });
    }

    for (const employee of employees) {
      if (employee.dateOfBirth) {
        const dob = new Date(employee.dateOfBirth);
        const birthdayThisYear = new Date(start.getFullYear(), dob.getMonth(), dob.getDate());
        if (birthdayThisYear >= start && birthdayThisYear <= end) {
          events.push({
            id: `birthday-${employee.id}`,
            type: 'birthday',
            title: `${employee.firstName} ${employee.lastName}'s Birthday`,
            date: birthdayThisYear,
            employeeId: employee.id,
          });
        }
      }

      const joined = new Date(employee.joinedAt);
      const anniversaryThisYear = new Date(
        start.getFullYear(),
        joined.getMonth(),
        joined.getDate(),
      );
      if (anniversaryThisYear >= start && anniversaryThisYear <= end) {
        const years = start.getFullYear() - joined.getFullYear();
        if (years > 0) {
          events.push({
            id: `anniversary-${employee.id}`,
            type: 'work_anniversary',
            title: `${employee.firstName} ${employee.lastName} — ${String(years)} year${years > 1 ? 's' : ''}`,
            date: anniversaryThisYear,
            employeeId: employee.id,
          });
        }
      }
    }

    events.sort(
      (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime(),
    );

    return { events, startDate, endDate };
  },
};
