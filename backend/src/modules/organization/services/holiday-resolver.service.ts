import {
  HOLIDAY_TYPE,
  HolidayModuleRepository,
  HolidayRepository,
  type HolidayDocument,
} from '@domain/organization/organization.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { endOfDay, startOfDay } from '@shared/utils/date.util.js';

export interface HolidayScopeContext {
  branchId?: string;
  departmentId?: string;
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
  if (holiday.status !== ENTITY_STATUS.ACTIVE) {
    return false;
  }

  if (!branchMatches(holiday.branchId, scope.branchId)) {
    return false;
  }

  if (holiday.holidayModuleId) {
    return moduleAppliesToDepartment(moduleDepartmentIds, scope.departmentId);
  }

  return true;
}

async function resolveModuleMap(
  companyId: string,
  scope: HolidayScopeContext,
): Promise<Map<string, string[]>> {
  const modules = await HolidayModuleRepository.findMany(
    { status: ENTITY_STATUS.ACTIVE },
    { companyId },
  );

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

export const HolidayResolverService = {
  async isHoliday(
    companyId: string,
    date: Date,
    scope: HolidayScopeContext = {},
  ): Promise<boolean> {
    const holiday = await this.findHoliday(companyId, date, scope);
    return Boolean(holiday);
  },

  async findHoliday(
    companyId: string,
    date: Date,
    scope: HolidayScopeContext = {},
  ): Promise<HolidayDocument | null> {
    const day = startOfDay(date);
    const moduleMap = await resolveModuleMap(companyId, scope);
    const applicableModuleIds = [...moduleMap.keys()];

    const holidays = await HolidayRepository.findMany(
      { status: ENTITY_STATUS.ACTIVE },
      { companyId },
    );

    for (const holiday of holidays) {
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
  },

  async listHolidaysInRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
    scope: HolidayScopeContext = {},
  ): Promise<Array<{ id: string; name: string; date: Date; type: string; isOptional: boolean }>> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const moduleMap = await resolveModuleMap(companyId, scope);
    const applicableModuleIds = [...moduleMap.keys()];

    const holidays = await HolidayRepository.findMany(
      { status: ENTITY_STATUS.ACTIVE },
      { companyId },
    );

    const events: Array<{
      id: string;
      name: string;
      date: Date;
      type: string;
      isOptional: boolean;
    }> = [];
    const seen = new Set<string>();

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const day = startOfDay(cursor);

      for (const holiday of holidays) {
        if (holiday.holidayModuleId && !applicableModuleIds.includes(holiday.holidayModuleId)) {
          continue;
        }

        const moduleDeptIds = holiday.holidayModuleId
          ? moduleMap.get(holiday.holidayModuleId)
          : undefined;

        if (!holidayAppliesToScope(holiday, moduleDeptIds, scope)) {
          continue;
        }

        const matches = matchesWeekly(holiday, day) || matchesFixedDate(holiday, day);
        if (!matches) {
          continue;
        }

        const key = `${holiday.id}:${day.toISOString().slice(0, 10)}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        events.push({
          id: holiday.id,
          name: holiday.name,
          date: new Date(day),
          type: holiday.type,
          isOptional: holiday.isOptional,
        });
      }
    }

    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    return events;
  },
};
