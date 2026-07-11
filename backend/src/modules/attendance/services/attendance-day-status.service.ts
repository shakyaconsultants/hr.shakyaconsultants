import type { AttendanceDocument } from '@domain/attendance/attendance.schemas.js';
import { HolidayResolverService } from '@modules/organization/services/holiday-resolver.service.js';
import { AttendancePolicyService } from '@modules/attendance/services/attendance-policy.service.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import { startOfDay } from '@shared/utils/date.util.js';

export interface AttendanceDayFlags {
  isWeekend: boolean;
  isHoliday: boolean;
}

export interface AttendanceDayScope {
  branchId?: string;
  departmentId?: string;
}

export const AttendanceDayStatusService = {
  async getDayFlags(
    companyId: string,
    date: Date,
    scope: AttendanceDayScope = {},
  ): Promise<AttendanceDayFlags> {
    const policies = await AttendancePolicyService.getPolicies(companyId);
    const day = startOfDay(date);
    const isWeekend = policies.weeklyOffDays.includes(day.getDay());
    const holiday = await HolidayResolverService.findHoliday(companyId, day, scope);
    return {
      isWeekend,
      isHoliday: Boolean(holiday),
    };
  },

  resolveDisplayStatus(
    record: Pick<AttendanceDocument, 'status' | 'checkIn'> | null | undefined,
    flags: AttendanceDayFlags,
  ): string {
    if (record?.checkIn) {
      return record.status;
    }
    if (record?.status === ATTENDANCE_STATUS.ON_LEAVE) {
      return ATTENDANCE_STATUS.ON_LEAVE;
    }
    if (flags.isHoliday) {
      return ATTENDANCE_STATUS.HOLIDAY;
    }
    if (flags.isWeekend) {
      return ATTENDANCE_STATUS.WEEKEND;
    }
    return record?.status ?? 'unmarked';
  },

  resolveInitialStatus(flags: AttendanceDayFlags): string {
    if (flags.isHoliday) {
      return ATTENDANCE_STATUS.HOLIDAY;
    }
    if (flags.isWeekend) {
      return ATTENDANCE_STATUS.WEEKEND;
    }
    return ATTENDANCE_STATUS.ABSENT;
  },

  shouldHealStoredStatus(
    record: Pick<AttendanceDocument, 'status' | 'checkIn'>,
    flags: AttendanceDayFlags,
  ): boolean {
    if (record.checkIn) {
      return false;
    }
    const expected = this.resolveDisplayStatus(record, flags);
    return record.status !== expected;
  },
};
