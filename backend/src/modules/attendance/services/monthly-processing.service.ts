import { AttendanceRepository } from '@domain/attendance/attendance.schemas.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import { AttendanceEventService, ATTENDANCE_NOTIFICATION_JOB } from '@modules/attendance/services/attendance-event.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

export const AttendanceMonthlyProcessingService = {
  async processMonth(context: AttendanceActorContext, payload: {
    year: number;
    month: number;
    departmentId?: string;
    branchId?: string;
  }) {
    const monthStart = startOfDay(new Date(payload.year, payload.month - 1, 1));
    const monthEnd = endOfDay(new Date(payload.year, payload.month, 0));
    const processedMonth = `${payload.year}-${String(payload.month).padStart(2, '0')}`;

    const filter: Record<string, unknown> = {
      date: { $gte: monthStart, $lte: monthEnd },
    };
    if (payload.departmentId) filter.departmentId = payload.departmentId;
    if (payload.branchId) filter.branchId = payload.branchId;

    const records = await AttendanceRepository.findMany(filter, { companyId: context.companyId });

    let processed = 0;
    for (const record of records) {
      const payableStatuses: string[] = [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.HOLIDAY];
      const payableDays = payableStatuses.includes(record.status)
        ? 1
        : record.status === ATTENDANCE_STATUS.HALF_DAY
          ? 0.5
          : 0;

      await AttendanceRepository.update(
        record.id,
        {
          payrollSnapshot: {
            ...(record.payrollSnapshot ?? {}),
            processedAt: new Date(),
            processedMonth,
            status: record.status,
            workedMinutes: record.workedMinutes ?? 0,
            lateMinutes: record.lateMinutes ?? 0,
            overtimeMinutes: record.overtimeMinutes ?? 0,
            payableDays,
            lopDays: payableDays === 0 && record.status !== ATTENDANCE_STATUS.WEEKEND ? 1 : 0,
          },
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
      processed++;
    }

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'attendance_processing',
      entityId: processedMonth,
      action: 'process',
      after: { processedMonth, processed, departmentId: payload.departmentId, branchId: payload.branchId },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await AttendanceEventService.publishActivity(context, {
      activityType: 'attendance_monthly_processed',
      description: `Processed ${String(processed)} attendance records for ${processedMonth}`,
      entityType: 'attendance_processing',
      entityId: processedMonth,
      metadata: { processed, processedMonth },
    });

    if (context.userId) {
      await AttendanceEventService.notify(context, {
        recipientUserId: context.userId,
        title: 'Monthly attendance processed',
        body: `${String(processed)} records processed for ${processedMonth}`,
        entityType: 'attendance_processing',
        entityId: processedMonth,
        jobName: ATTENDANCE_NOTIFICATION_JOB.MONTHLY_PROCESSED,
      });
    }

    return { processedMonth, processed, total: records.length };
  },
};
