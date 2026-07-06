import { DepartmentRepository } from '@domain/organization/organization.schemas.js';
import {
  HOLIDAY_TYPE,
  HolidayModuleRepository,
  HolidayRepository,
} from '@domain/organization/organization.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ValidationError } from '@shared/errors/app.error.js';

function normalizeDepartmentIds(payload: Record<string, unknown>): string[] {
  if (Array.isArray(payload.departmentIds)) {
    return payload.departmentIds.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
  }
  if (typeof payload.departmentId === 'string' && payload.departmentId) {
    return [payload.departmentId];
  }
  return [];
}

async function assertDepartmentsExist(companyId: string, departmentIds: string[]): Promise<void> {
  if (departmentIds.length === 0) {
    return;
  }

  const departments = await DepartmentRepository.findMany(
    { id: { $in: departmentIds }, status: ENTITY_STATUS.ACTIVE },
    { companyId },
  );

  if (departments.length !== departmentIds.length) {
    throw new ValidationError('One or more departments are invalid or inactive');
  }
}

export const HolidayModuleValidationService = {
  async validateWrite(
    companyId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const departmentIds = normalizeDepartmentIds(payload);
    await assertDepartmentsExist(companyId, departmentIds);

    const next: Record<string, unknown> = { ...payload, departmentIds };
    delete next.departmentId;

    if (
      payload.calendarYear !== undefined &&
      payload.calendarYear !== null &&
      payload.calendarYear !== ''
    ) {
      const year = Number(payload.calendarYear);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new ValidationError('Calendar year must be between 2000 and 2100');
      }
      next.calendarYear = year;
    } else {
      next.calendarYear = undefined;
    }

    return next;
  },

  async assertCanDelete(companyId: string, moduleId: string): Promise<void> {
    const linked = await HolidayRepository.findOne(
      { holidayModuleId: moduleId, status: ENTITY_STATUS.ACTIVE },
      { companyId },
    );
    if (linked) {
      throw new ValidationError('Cannot delete holiday module while holidays are assigned to it');
    }
  },
};

export const HolidayValidationService = {
  async validateWrite(
    companyId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const type = typeof payload.type === 'string' ? payload.type : HOLIDAY_TYPE.PUBLIC;
    const next: Record<string, unknown> = { ...payload, type };

    if (typeof payload.holidayModuleId !== 'string' || !payload.holidayModuleId) {
      throw new ValidationError('Holiday module is required — schedule holidays inside a module');
    }

    const module = await HolidayModuleRepository.findById(payload.holidayModuleId, { companyId });
    if (!module || module.status !== ENTITY_STATUS.ACTIVE) {
      throw new ValidationError('Holiday module is invalid or inactive');
    }

    if (type === HOLIDAY_TYPE.WEEKLY) {
      const dayOfWeek = Number(payload.dayOfWeek);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new ValidationError('Weekly holidays require a valid day of week (0–6)');
      }
      next.dayOfWeek = dayOfWeek;
      next.isRecurring = true;
      next.recurrenceRule = 'weekly';
      next.date = undefined;
      return next;
    }

    if (!payload.date) {
      throw new ValidationError('Holiday date is required for non-weekly holidays');
    }

    if (payload.date instanceof Date) {
      next.date = payload.date;
    } else if (typeof payload.date === 'string') {
      next.date = new Date(payload.date);
    } else {
      throw new ValidationError('Invalid holiday date');
    }
    next.dayOfWeek = undefined;

    if (type === HOLIDAY_TYPE.BRANCH && !payload.branchId) {
      throw new ValidationError('Branch is required for branch holidays');
    }

    if (type !== HOLIDAY_TYPE.BRANCH) {
      next.branchId = undefined;
    }

    return next;
  },
};
