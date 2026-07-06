import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { HolidayResolverService } from '@modules/organization/services/holiday-resolver.service.js';
import { LeaveRequestService } from '@modules/leave-exit/services/leave-request.service.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const CompanyCalendarService = {
  async getEvents(companyId: string, startDate: string, endDate: string, employeeId?: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let scope: { branchId?: string; departmentId?: string } = {};
    if (employeeId) {
      const employee = await EmployeeRepository.findById(employeeId, { companyId });
      if (employee) {
        scope = { branchId: employee.branchId, departmentId: employee.departmentId };
      }
    }

    const [holidays, approvedLeave, employees] = await Promise.all([
      HolidayResolverService.listHolidaysInRange(companyId, start, end, scope),
      LeaveRequestService.getCalendar(companyId, startDate, endDate, employeeId),
      EmployeeRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
    ]);

    const events: Record<string, unknown>[] = [];

    for (const holiday of holidays) {
      events.push({ id: holiday.id, type: 'holiday', title: holiday.name, date: holiday.date });
    }

    for (const leave of approvedLeave) {
      events.push({
        id: leave.id,
        type: 'approved_leave',
        title: 'Approved Leave',
        date: leave.startDate,
        endDate: leave.endDate,
        employeeId: leave.employeeId,
      });
    }

    for (const employee of employees) {
      if (employee.dateOfBirth) {
        const dob = new Date(employee.dateOfBirth);
        const birthday = new Date(start.getFullYear(), dob.getMonth(), dob.getDate());
        if (birthday >= start && birthday <= end) {
          events.push({
            id: `birthday-${employee.id}`,
            type: 'birthday',
            title: `${employee.firstName} ${employee.lastName}'s Birthday`,
            date: birthday,
            employeeId: employee.id,
          });
        }
      }

      const joined = new Date(employee.joinedAt);
      const anniversary = new Date(start.getFullYear(), joined.getMonth(), joined.getDate());
      if (anniversary >= start && anniversary <= end) {
        const years = start.getFullYear() - joined.getFullYear();
        if (years > 0) {
          events.push({
            id: `anniversary-${employee.id}`,
            type: 'work_anniversary',
            title: `${employee.firstName} ${employee.lastName} — ${String(years)} year${years > 1 ? 's' : ''}`,
            date: anniversary,
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
