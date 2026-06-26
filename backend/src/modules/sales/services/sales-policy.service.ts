import { AppSettingRepository, SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import {
  DEFAULT_SALES_POLICIES,
  SALES_POLICY_KEYS,
} from '@modules/sales/constants/sales.constants.js';
import { SalesAuditService } from '@modules/sales/services/sales-audit.service.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export interface SalesAssignmentRules {
  autoAssignEnabled: boolean;
  roundRobin: boolean;
  territoryBased: boolean;
  defaultTeamId: string | null;
}

export interface SalesScoringRules {
  rules: Array<{ field: string; operator: string; value: unknown; points: number }>;
  maxScore: number;
}

export interface SalesPolicyConfig {
  requireLostReason: boolean;
  requireWonReason: boolean;
  defaultCurrency: string;
  defaultPipelineName: string;
}

export interface SalesPolicySettings {
  assignmentRules: SalesAssignmentRules;
  scoringRules: SalesScoringRules;
  policies: SalesPolicyConfig;
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
      group: SETTING_GROUP.SALES,
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

export const SalesPolicyService = {
  async getPolicies(companyId: string): Promise<SalesPolicySettings> {
    const [assignmentRules, scoringRules, policies] = await Promise.all([
      getSettingValue(companyId, SALES_POLICY_KEYS.ASSIGNMENT_RULES),
      getSettingValue(companyId, SALES_POLICY_KEYS.SCORING_RULES),
      getSettingValue(companyId, SALES_POLICY_KEYS.POLICIES),
    ]);

    return {
      assignmentRules: typeof assignmentRules === 'object' && assignmentRules !== null
        ? { ...DEFAULT_SALES_POLICIES.assignmentRules, ...(assignmentRules as SalesAssignmentRules) }
        : { ...DEFAULT_SALES_POLICIES.assignmentRules },
      scoringRules: typeof scoringRules === 'object' && scoringRules !== null
        ? { ...DEFAULT_SALES_POLICIES.scoringRules, ...(scoringRules as SalesScoringRules) }
        : { ...DEFAULT_SALES_POLICIES.scoringRules, rules: [...DEFAULT_SALES_POLICIES.scoringRules.rules] },
      policies: typeof policies === 'object' && policies !== null
        ? { ...DEFAULT_SALES_POLICIES.policies, ...(policies as SalesPolicyConfig) }
        : { ...DEFAULT_SALES_POLICIES.policies },
    };
  },

  async updatePolicies(context: SalesActorContext, payload: {
    assignmentRules?: Partial<SalesAssignmentRules>;
    scoringRules?: Partial<SalesScoringRules>;
    policies?: Partial<SalesPolicyConfig>;
  }): Promise<SalesPolicySettings> {
    const before = await this.getPolicies(context.companyId);
    const current = before;

    if (payload.assignmentRules !== undefined) {
      await upsertSetting(context.companyId, SALES_POLICY_KEYS.ASSIGNMENT_RULES, { ...current.assignmentRules, ...payload.assignmentRules }, SETTING_VALUE_TYPE.JSON, 'Sales lead assignment rules', context.userId);
    }
    if (payload.scoringRules !== undefined) {
      await upsertSetting(context.companyId, SALES_POLICY_KEYS.SCORING_RULES, { ...current.scoringRules, ...payload.scoringRules }, SETTING_VALUE_TYPE.JSON, 'Sales lead scoring rules', context.userId);
    }
    if (payload.policies !== undefined) {
      await upsertSetting(context.companyId, SALES_POLICY_KEYS.POLICIES, { ...current.policies, ...payload.policies }, SETTING_VALUE_TYPE.JSON, 'Sales CRM policies', context.userId);
    }

    const after = await this.getPolicies(context.companyId);

    await SalesAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sales_policy',
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
