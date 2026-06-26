import { AppSettingRepository, SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import {
  DEFAULT_PAYROLL_POLICIES,
  PAYROLL_POLICY_KEYS,
} from '@modules/payroll/constants/payroll.constants.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

export interface StatutoryPluginConfig {
  pluginId: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface PayrollPolicySettings {
  calendarStartDay: number;
  lockAfterDays: number;
  approvalWorkflowSlug: string;
  revisionWorkflowSlug: string;
  statutoryPlugins: StatutoryPluginConfig[];
  overtimeRateMultiplier: number;
  lwpDeductionBasis: string;
  companyDisplayName: string;
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
      group: SETTING_GROUP.PAYROLL,
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

export const PayrollPolicyService = {
  async getPolicies(companyId: string): Promise<PayrollPolicySettings> {
    const [
      calendarStartDay,
      lockAfterDays,
      approvalWorkflowSlug,
      revisionWorkflowSlug,
      statutoryPlugins,
      overtimeRateMultiplier,
      lwpDeductionBasis,
      companyDisplayName,
    ] = await Promise.all([
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.CALENDAR_START_DAY),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.LOCK_AFTER_DAYS),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.APPROVAL_WORKFLOW_SLUG),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.REVISION_WORKFLOW_SLUG),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.STATUTORY_PLUGINS),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.OVERTIME_RATE_MULTIPLIER),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.LWP_DEDUCTION_BASIS),
      getSettingValue(companyId, PAYROLL_POLICY_KEYS.COMPANY_DISPLAY_NAME),
    ]);

    return {
      calendarStartDay: typeof calendarStartDay === 'number' ? calendarStartDay : DEFAULT_PAYROLL_POLICIES.calendarStartDay,
      lockAfterDays: typeof lockAfterDays === 'number' ? lockAfterDays : DEFAULT_PAYROLL_POLICIES.lockAfterDays,
      approvalWorkflowSlug: typeof approvalWorkflowSlug === 'string' ? approvalWorkflowSlug : DEFAULT_PAYROLL_POLICIES.approvalWorkflowSlug,
      revisionWorkflowSlug: typeof revisionWorkflowSlug === 'string' ? revisionWorkflowSlug : DEFAULT_PAYROLL_POLICIES.revisionWorkflowSlug,
      statutoryPlugins: Array.isArray(statutoryPlugins) ? statutoryPlugins as StatutoryPluginConfig[] : [...DEFAULT_PAYROLL_POLICIES.statutoryPlugins],
      overtimeRateMultiplier: typeof overtimeRateMultiplier === 'number' ? overtimeRateMultiplier : DEFAULT_PAYROLL_POLICIES.overtimeRateMultiplier,
      lwpDeductionBasis: typeof lwpDeductionBasis === 'string' ? lwpDeductionBasis : DEFAULT_PAYROLL_POLICIES.lwpDeductionBasis,
      companyDisplayName: typeof companyDisplayName === 'string' ? companyDisplayName : DEFAULT_PAYROLL_POLICIES.companyDisplayName,
    };
  },

  async updatePolicies(context: PayrollActorContext, payload: Partial<PayrollPolicySettings>): Promise<PayrollPolicySettings> {
    const before = await this.getPolicies(context.companyId);

    if (payload.calendarStartDay !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.CALENDAR_START_DAY, payload.calendarStartDay, SETTING_VALUE_TYPE.NUMBER, 'Payroll calendar start day', context.userId);
    }
    if (payload.lockAfterDays !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.LOCK_AFTER_DAYS, payload.lockAfterDays, SETTING_VALUE_TYPE.NUMBER, 'Days after which payroll is locked', context.userId);
    }
    if (payload.approvalWorkflowSlug !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.APPROVAL_WORKFLOW_SLUG, payload.approvalWorkflowSlug, SETTING_VALUE_TYPE.STRING, 'Approval workflow slug for payroll runs', context.userId);
    }
    if (payload.revisionWorkflowSlug !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.REVISION_WORKFLOW_SLUG, payload.revisionWorkflowSlug, SETTING_VALUE_TYPE.STRING, 'Approval workflow slug for salary revisions', context.userId);
    }
    if (payload.statutoryPlugins !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.STATUTORY_PLUGINS, payload.statutoryPlugins, SETTING_VALUE_TYPE.JSON, 'Configurable statutory plugin configs', context.userId);
    }
    if (payload.overtimeRateMultiplier !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.OVERTIME_RATE_MULTIPLIER, payload.overtimeRateMultiplier, SETTING_VALUE_TYPE.NUMBER, 'Overtime rate multiplier', context.userId);
    }
    if (payload.lwpDeductionBasis !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.LWP_DEDUCTION_BASIS, payload.lwpDeductionBasis, SETTING_VALUE_TYPE.STRING, 'LWP deduction basis', context.userId);
    }
    if (payload.companyDisplayName !== undefined) {
      await upsertSetting(context.companyId, PAYROLL_POLICY_KEYS.COMPANY_DISPLAY_NAME, payload.companyDisplayName, SETTING_VALUE_TYPE.STRING, 'Company display name on payslips', context.userId);
    }

    const after = await this.getPolicies(context.companyId);

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_policy',
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
