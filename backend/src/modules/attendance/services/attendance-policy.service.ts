import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import { SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import {
  ATTENDANCE_POLICY_KEYS,
  DEFAULT_ATTENDANCE_POLICIES,
} from '@modules/attendance/constants/attendance.constants.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

export interface AttendancePolicySettings {
  graceMinutes: number;
  lateThresholdMinutes: number;
  earlyExitThresholdMinutes: number;
  overtimeThresholdMinutes: number;
  halfDayThresholdMinutes: number;
  weeklyOffDays: number[];
  correctionWorkflowSlug: string;
}

async function getSettingValue(companyId: string, key: string): Promise<unknown> {
  const setting = await AppSettingRepository.findOne({ key }, { companyId });
  return setting?.value;
}

async function upsertSetting(
  companyId: string,
  key: string,
  value: unknown,
  valueType: string,
  description: string,
  userId: string,
): Promise<void> {
  const existing = await AppSettingRepository.findOne({ key }, { companyId });
  if (existing) {
    await AppSettingRepository.update(existing.id, { value, updatedBy: userId }, { companyId });
    return;
  }

  await AppSettingRepository.create(
    {
      id: generateUuid(),
      companyId,
      key,
      value,
      valueType,
      group: SETTING_GROUP.ATTENDANCE,
      description,
      isEditable: true,
      isPublic: false,
      encrypted: false,
      createdBy: userId,
      updatedBy: userId,
    },
    { companyId },
  );
}

export const AttendancePolicyService = {
  async getPolicies(companyId: string): Promise<AttendancePolicySettings> {
    const [
      graceMinutes,
      lateThresholdMinutes,
      earlyExitThresholdMinutes,
      overtimeThresholdMinutes,
      halfDayThresholdMinutes,
      weeklyOffDays,
      correctionWorkflowSlug,
    ] = await Promise.all([
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.GRACE_MINUTES),
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.LATE_THRESHOLD_MINUTES),
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.EARLY_EXIT_THRESHOLD_MINUTES),
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.OVERTIME_THRESHOLD_MINUTES),
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.HALF_DAY_THRESHOLD_MINUTES),
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.WEEKLY_OFF_DAYS),
      getSettingValue(companyId, ATTENDANCE_POLICY_KEYS.CORRECTION_WORKFLOW_SLUG),
    ]);

    return {
      graceMinutes: typeof graceMinutes === 'number' ? graceMinutes : DEFAULT_ATTENDANCE_POLICIES.graceMinutes,
      lateThresholdMinutes: typeof lateThresholdMinutes === 'number' ? lateThresholdMinutes : DEFAULT_ATTENDANCE_POLICIES.lateThresholdMinutes,
      earlyExitThresholdMinutes: typeof earlyExitThresholdMinutes === 'number' ? earlyExitThresholdMinutes : DEFAULT_ATTENDANCE_POLICIES.earlyExitThresholdMinutes,
      overtimeThresholdMinutes: typeof overtimeThresholdMinutes === 'number' ? overtimeThresholdMinutes : DEFAULT_ATTENDANCE_POLICIES.overtimeThresholdMinutes,
      halfDayThresholdMinutes: typeof halfDayThresholdMinutes === 'number' ? halfDayThresholdMinutes : DEFAULT_ATTENDANCE_POLICIES.halfDayThresholdMinutes,
      weeklyOffDays: Array.isArray(weeklyOffDays) ? weeklyOffDays as number[] : [...DEFAULT_ATTENDANCE_POLICIES.weeklyOffDays],
      correctionWorkflowSlug: typeof correctionWorkflowSlug === 'string' ? correctionWorkflowSlug : DEFAULT_ATTENDANCE_POLICIES.correctionWorkflowSlug,
    };
  },

  async updatePolicies(context: AttendanceActorContext, payload: Partial<AttendancePolicySettings>): Promise<AttendancePolicySettings> {
    const before = await this.getPolicies(context.companyId);

    if (payload.graceMinutes !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.GRACE_MINUTES, payload.graceMinutes, SETTING_VALUE_TYPE.NUMBER, 'Grace period in minutes', context.userId);
    }
    if (payload.lateThresholdMinutes !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.LATE_THRESHOLD_MINUTES, payload.lateThresholdMinutes, SETTING_VALUE_TYPE.NUMBER, 'Late threshold in minutes', context.userId);
    }
    if (payload.earlyExitThresholdMinutes !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.EARLY_EXIT_THRESHOLD_MINUTES, payload.earlyExitThresholdMinutes, SETTING_VALUE_TYPE.NUMBER, 'Early exit threshold in minutes', context.userId);
    }
    if (payload.overtimeThresholdMinutes !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.OVERTIME_THRESHOLD_MINUTES, payload.overtimeThresholdMinutes, SETTING_VALUE_TYPE.NUMBER, 'Overtime threshold in minutes', context.userId);
    }
    if (payload.halfDayThresholdMinutes !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.HALF_DAY_THRESHOLD_MINUTES, payload.halfDayThresholdMinutes, SETTING_VALUE_TYPE.NUMBER, 'Half day threshold in minutes', context.userId);
    }
    if (payload.weeklyOffDays !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.WEEKLY_OFF_DAYS, payload.weeklyOffDays, SETTING_VALUE_TYPE.JSON, 'Weekly off days (0=Sunday)', context.userId);
    }
    if (payload.correctionWorkflowSlug !== undefined) {
      await upsertSetting(context.companyId, ATTENDANCE_POLICY_KEYS.CORRECTION_WORKFLOW_SLUG, payload.correctionWorkflowSlug, SETTING_VALUE_TYPE.STRING, 'Approval workflow slug for corrections', context.userId);
    }

    const after = await this.getPolicies(context.companyId);

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'attendance_policy',
      entityId: context.companyId,
      action: 'update',
      before: before as unknown as Record<string, unknown>,
      after: after as unknown as Record<string, unknown>,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return after;
  },
};
