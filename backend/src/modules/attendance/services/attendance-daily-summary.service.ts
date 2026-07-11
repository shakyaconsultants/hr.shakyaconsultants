import {
  AttendanceDailySummaryRepository,
  AttendanceRepository,
  type AttendanceDailySummaryDocument,
} from '@domain/attendance/attendance.schemas.js';
import {
  EMPLOYEE_EMPLOYMENT_STATUS,
  EmployeeRepository,
} from '@domain/employee/employee.schemas.js';
import {
  HolidayModuleRepository,
  HolidayRepository,
  HOLIDAY_TYPE,
  type HolidayDocument,
} from '@domain/organization/organization.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { logger } from '@logging/winston.logger.js';
import { AttendanceDayStatusService } from '@modules/attendance/services/attendance-day-status.service.js';
import { AttendancePolicyService } from '@modules/attendance/services/attendance-policy.service.js';
import { HolidayResolverService } from '@modules/organization/services/holiday-resolver.service.js';

function toLocalDateKey(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const activeEmployeeFilter: Record<string, unknown> = {
  status: ENTITY_STATUS.ACTIVE,
  isDeleted: false,
  employmentStatus: {
    $nin: [EMPLOYEE_EMPLOYMENT_STATUS.TERMINATED, EMPLOYEE_EMPLOYMENT_STATUS.RESIGNED],
  },
};

export interface DailySummaryPayload {
  date: Date;
  dayType: 'working' | 'weekly_off' | 'holiday';
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  onLeaveCount: number;
  totalEmployees: number;
}

interface HolidayScopeContext {
  branchId?: string;
  departmentId?: string;
}

interface HolidayLookupContext {
  holidays: HolidayDocument[];
  modules: Awaited<ReturnType<typeof HolidayModuleRepository.findMany>>;
  moduleMapByScope: Map<string, Map<string, string[]>>;
}

function moduleAppliesToDepartment(
  departmentIds: string[] | undefined,
  departmentId?: string,
): boolean {
  const ids = departmentIds ?? [];
  if (ids.length === 0) {
    return true;
  }
  if (!departmentId) {
    return false;
  }
  return ids.includes(departmentId);
}

function branchMatches(holidayBranchId: string | undefined, branchId?: string): boolean {
  if (!holidayBranchId) {
    return true;
  }
  return Boolean(branchId && holidayBranchId === branchId);
}

function matchesFixedDate(holiday: HolidayDocument, day: Date): boolean {
  if (!holiday.date) {
    return false;
  }

  const holidayDate = startOfDay(new Date(holiday.date));

  if (holiday.isRecurring && holiday.recurrenceRule === 'yearly') {
    return holidayDate.getMonth() === day.getMonth() && holidayDate.getDate() === day.getDate();
  }

  return holidayDate.getTime() === day.getTime();
}

function matchesWeekly(holiday: HolidayDocument, day: Date): boolean {
  if (holiday.type !== HOLIDAY_TYPE.WEEKLY) {
    return false;
  }
  if (holiday.dayOfWeek === undefined) {
    return false;
  }
  return holiday.dayOfWeek === day.getDay();
}

function holidayAppliesToScope(
  holiday: HolidayDocument,
  moduleDepartmentIds: string[] | undefined,
  scope: HolidayScopeContext,
): boolean {
  if (!branchMatches(holiday.branchId, scope.branchId)) {
    return false;
  }

  if (holiday.holidayModuleId) {
    return moduleAppliesToDepartment(moduleDepartmentIds, scope.departmentId);
  }

  return true;
}

function buildModuleMap(
  modules: HolidayLookupContext['modules'],
  scope: HolidayScopeContext,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const module of modules) {
    if (!branchMatches(module.branchId, scope.branchId)) {
      continue;
    }
    if (!moduleAppliesToDepartment(module.departmentIds, scope.departmentId)) {
      continue;
    }
    map.set(module.id, module.departmentIds);
  }
  return map;
}

function scopeKey(scope: HolidayScopeContext): string {
  return `${scope.branchId ?? ''}:${scope.departmentId ?? ''}`;
}

async function loadHolidayLookupContext(companyId: string): Promise<HolidayLookupContext> {
  const [holidays, modules] = await Promise.all([
    HolidayRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
    HolidayModuleRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId }),
  ]);

  return {
    holidays,
    modules,
    moduleMapByScope: new Map(),
  };
}

function findHolidayInMemory(
  day: Date,
  scope: HolidayScopeContext,
  context: HolidayLookupContext,
): HolidayDocument | null {
  const key = scopeKey(scope);
  let moduleMap = context.moduleMapByScope.get(key);
  if (!moduleMap) {
    moduleMap = buildModuleMap(context.modules, scope);
    context.moduleMapByScope.set(key, moduleMap);
  }

  const applicableModuleIds = [...moduleMap.keys()];

  for (const holiday of context.holidays) {
    if (holiday.holidayModuleId && !applicableModuleIds.includes(holiday.holidayModuleId)) {
      continue;
    }

    const moduleDeptIds = holiday.holidayModuleId
      ? moduleMap.get(holiday.holidayModuleId)
      : undefined;

    if (!holidayAppliesToScope(holiday, moduleDeptIds, scope)) {
      continue;
    }

    if (matchesWeekly(holiday, day) || matchesFixedDate(holiday, day)) {
      return holiday;
    }
  }

  return null;
}

function resolveDayType(
  day: Date,
  weeklyOffDays: number[],
  companyHolidayDates: Set<string>,
): 'working' | 'weekly_off' | 'holiday' {
  if (companyHolidayDates.has(toLocalDateKey(day))) {
    return 'holiday';
  }
  if (weeklyOffDays.includes(day.getDay())) {
    return 'weekly_off';
  }
  return 'working';
}

function countDaysInclusive(rangeStart: Date, rangeEnd: Date): number {
  const cursor = new Date(rangeStart);
  let count = 0;
  while (cursor <= rangeEnd) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export const AttendanceDailySummaryService = {
  toApiShape(summary: {
    date: Date | string;
    dayType: 'working' | 'weekly_off' | 'holiday';
    presentCount: number;
    absentCount: number;
    halfDayCount?: number;
    totalEmployees: number;
  }) {
    const date =
      typeof summary.date === 'string' ? summary.date.slice(0, 10) : toLocalDateKey(summary.date);

    return {
      date,
      dayType: summary.dayType,
      presentCount: summary.presentCount + (summary.halfDayCount ?? 0),
      absentCount: summary.absentCount,
      totalEmployees: summary.totalEmployees,
    };
  },

  async computeForRange(
    companyId: string,
    startDate: string,
    endDate: string,
    skipDateKeys?: Set<string>,
  ): Promise<DailySummaryPayload[]> {
    const rangeStart = startOfDay(new Date(startDate));
    const rangeEnd = startOfDay(new Date(endDate));
    const rangeEndInclusive = endOfDay(new Date(endDate));

    const [policies, employees, records, holidayContext, companyHolidayEvents] = await Promise.all([
      AttendancePolicyService.getPolicies(companyId),
      EmployeeRepository.findMany(activeEmployeeFilter, { companyId }),
      AttendanceRepository.findMany(
        { date: { $gte: rangeStart, $lte: rangeEndInclusive } },
        { companyId },
      ),
      loadHolidayLookupContext(companyId),
      HolidayResolverService.listHolidaysInRange(companyId, rangeStart, rangeEnd, {}),
    ]);

    const companyHolidayDates = new Set(
      companyHolidayEvents.map((holiday) => toLocalDateKey(holiday.date)),
    );

    const recordByEmployeeAndDate = new Map<string, (typeof records)[number]>();
    for (const record of records) {
      recordByEmployeeAndDate.set(`${record.employeeId}:${toLocalDateKey(record.date)}`, record);
    }

    const summaries: DailySummaryPayload[] = [];
    const cursor = new Date(rangeStart);

    while (cursor <= rangeEnd) {
      const day = startOfDay(cursor);
      const dateKey = toLocalDateKey(day);

      if (skipDateKeys?.has(dateKey)) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      const dayType = resolveDayType(day, policies.weeklyOffDays, companyHolidayDates);

      if (dayType !== 'working') {
        summaries.push({
          date: day,
          dayType,
          presentCount: 0,
          absentCount: 0,
          halfDayCount: 0,
          onLeaveCount: 0,
          totalEmployees: employees.length,
        });
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      let presentCount = 0;
      let absentCount = 0;
      let halfDayCount = 0;
      let onLeaveCount = 0;

      for (const employee of employees) {
        const record = recordByEmployeeAndDate.get(`${employee.id}:${dateKey}`);
        const employeeHoliday = findHolidayInMemory(
          day,
          { branchId: employee.branchId, departmentId: employee.departmentId },
          holidayContext,
        );
        const status = AttendanceDayStatusService.resolveDisplayStatus(record, {
          isWeekend: false,
          isHoliday: Boolean(employeeHoliday),
        });

        switch (status) {
          case ATTENDANCE_STATUS.PRESENT:
          case ATTENDANCE_STATUS.LATE:
            presentCount += 1;
            break;
          case ATTENDANCE_STATUS.HALF_DAY:
            halfDayCount += 1;
            break;
          case ATTENDANCE_STATUS.ON_LEAVE:
            onLeaveCount += 1;
            break;
          case ATTENDANCE_STATUS.HOLIDAY:
            break;
          case ATTENDANCE_STATUS.ABSENT:
          case 'unmarked':
            absentCount += 1;
            break;
          default:
            break;
        }
      }

      summaries.push({
        date: day,
        dayType: 'working',
        presentCount,
        absentCount,
        halfDayCount,
        onLeaveCount,
        totalEmployees: employees.length,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return summaries;
  },

  async persistRangeAsync(companyId: string, summaries: DailySummaryPayload[]): Promise<void> {
    try {
      await Promise.all(summaries.map((summary) => this.upsertPayload(companyId, summary)));
    } catch (error) {
      logger.warn('Failed to persist attendance daily summaries', {
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async upsertPayload(
    companyId: string,
    computed: DailySummaryPayload,
    userId = 'system',
  ): Promise<AttendanceDailySummaryDocument> {
    const existing = await AttendanceDailySummaryRepository.findOne(
      { date: computed.date },
      { companyId },
    );

    if (existing) {
      const updated = await AttendanceDailySummaryRepository.update(
        existing.id,
        {
          dayType: computed.dayType,
          presentCount: computed.presentCount,
          absentCount: computed.absentCount,
          halfDayCount: computed.halfDayCount,
          onLeaveCount: computed.onLeaveCount,
          totalEmployees: computed.totalEmployees,
          lastComputedAt: new Date(),
          updatedBy: userId,
        },
        { companyId },
      );
      if (!updated) {
        throw new Error('Failed to update attendance daily summary');
      }
      return updated;
    }

    return AttendanceDailySummaryRepository.create(
      {
        id: generateUuid(),
        companyId,
        date: computed.date,
        dayType: computed.dayType,
        presentCount: computed.presentCount,
        absentCount: computed.absentCount,
        halfDayCount: computed.halfDayCount,
        onLeaveCount: computed.onLeaveCount,
        totalEmployees: computed.totalEmployees,
        lastComputedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
      { companyId },
    );
  },

  async refreshForDate(companyId: string, date: Date, userId?: string): Promise<void> {
    try {
      const computed = await this.computeForRange(
        companyId,
        toLocalDateKey(startOfDay(date)),
        toLocalDateKey(startOfDay(date)),
      );
      for (const summary of computed) {
        await this.upsertPayload(companyId, summary, userId ?? 'system');
      }
    } catch (error) {
      logger.warn('Failed to refresh attendance daily summary', {
        companyId,
        date: toLocalDateKey(startOfDay(date)),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async getSummariesForRange(companyId: string, startDate: string, endDate: string) {
    const rangeStart = startOfDay(new Date(startDate));
    const rangeEnd = startOfDay(new Date(endDate));
    const totalDays = countDaysInclusive(rangeStart, rangeEnd);

    const [policies, stored, companyHolidayEvents] = await Promise.all([
      AttendancePolicyService.getPolicies(companyId),
      AttendanceDailySummaryRepository.findMany(
        { date: { $gte: rangeStart, $lte: rangeEnd } },
        { companyId },
      ),
      HolidayResolverService.listHolidaysInRange(companyId, rangeStart, rangeEnd, {}),
    ]);

    const companyHolidayDates = new Set(
      companyHolidayEvents.map((holiday) => toLocalDateKey(holiday.date)),
    );
    const storedByDate = new Map(stored.map((entry) => [toLocalDateKey(entry.date), entry]));

    const missingDateKeys = new Set<string>();
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      const dateKey = toLocalDateKey(startOfDay(cursor));
      if (!storedByDate.has(dateKey)) {
        missingDateKeys.add(dateKey);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    let computedByDate: Map<string, DailySummaryPayload>;

    if (missingDateKeys.size === 0) {
      computedByDate = new Map(
        stored.map((entry) => [
          toLocalDateKey(entry.date),
          {
            date: startOfDay(entry.date),
            dayType: entry.dayType,
            presentCount: entry.presentCount,
            absentCount: entry.absentCount,
            halfDayCount: entry.halfDayCount,
            onLeaveCount: entry.onLeaveCount,
            totalEmployees: entry.totalEmployees,
          },
        ]),
      );
    } else if (missingDateKeys.size === totalDays) {
      const computed = await this.computeForRange(companyId, startDate, endDate);
      computedByDate = new Map(computed.map((entry) => [toLocalDateKey(entry.date), entry]));
      void this.persistRangeAsync(companyId, computed);
    } else {
      const computed = await this.computeForRange(
        companyId,
        startDate,
        endDate,
        new Set([...storedByDate.keys()]),
      );
      computedByDate = new Map(
        stored.map((entry) => [
          toLocalDateKey(entry.date),
          {
            date: startOfDay(entry.date),
            dayType: entry.dayType,
            presentCount: entry.presentCount,
            absentCount: entry.absentCount,
            halfDayCount: entry.halfDayCount,
            onLeaveCount: entry.onLeaveCount,
            totalEmployees: entry.totalEmployees,
          },
        ]),
      );
      for (const entry of computed) {
        computedByDate.set(toLocalDateKey(entry.date), entry);
      }
      void this.persistRangeAsync(companyId, computed);
    }

    const summaries: ReturnType<typeof this.toApiShape>[] = [];
    const responseCursor = new Date(rangeStart);
    while (responseCursor <= rangeEnd) {
      const day = startOfDay(responseCursor);
      const dateKey = toLocalDateKey(day);
      const counts = computedByDate.get(dateKey);
      const dayType = resolveDayType(day, policies.weeklyOffDays, companyHolidayDates);

      if (dayType === 'weekly_off' || dayType === 'holiday') {
        summaries.push({
          date: dateKey,
          dayType,
          presentCount: 0,
          absentCount: 0,
          totalEmployees: counts?.totalEmployees ?? 0,
        });
      } else if (counts) {
        summaries.push(this.toApiShape({ ...counts, dayType: 'working' }));
      } else {
        summaries.push({
          date: dateKey,
          dayType: 'working',
          presentCount: 0,
          absentCount: 0,
          totalEmployees: 0,
        });
      }

      responseCursor.setDate(responseCursor.getDate() + 1);
    }

    return summaries;
  },
};
