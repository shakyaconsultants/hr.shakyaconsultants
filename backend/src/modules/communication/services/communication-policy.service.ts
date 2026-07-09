import {
  AppSettingRepository,
  SETTING_GROUP,
  SETTING_VALUE_TYPE,
} from '@domain/master-data/master-data.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import {
  COMMUNICATION_POLICY_KEYS,
  DEFAULT_ANNOUNCEMENT_TEMPLATES,
  DEFAULT_COMMUNICATION_POLICIES,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@modules/communication/constants/communication.constants.js';
import { CommunicationAuditService } from '@modules/communication/services/communication-audit.service.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

export interface CommunicationPolicySettings {
  allowDirectMessages: boolean;
  allowPrivateChannels: boolean;
  allowEmployeeChannels: boolean;
  maxAttachmentSizeMb: number;
  messageRetentionDays: number;
  requireAcknowledgementDefault: boolean;
  emergencyBypassQuietHours: boolean;
}

export interface AnnouncementTemplate {
  slug: string;
  name: string;
  subject: string;
  body: string;
}

export interface NotificationPreferenceSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  digestFrequency: string;
  mutedCategories: string[];
}

export interface CommunicationSettings {
  policies: CommunicationPolicySettings;
  templates: AnnouncementTemplate[];
  preferences: NotificationPreferenceSettings;
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
      group: SETTING_GROUP.COMMUNICATION,
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

function mergePolicies(raw: unknown): CommunicationPolicySettings {
  if (typeof raw === 'object' && raw !== null) {
    return { ...DEFAULT_COMMUNICATION_POLICIES, ...(raw as CommunicationPolicySettings) };
  }
  return { ...DEFAULT_COMMUNICATION_POLICIES };
}

function mergeTemplates(raw: unknown): AnnouncementTemplate[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as AnnouncementTemplate[];
  }
  return [...DEFAULT_ANNOUNCEMENT_TEMPLATES];
}

function mergePreferences(raw: unknown): NotificationPreferenceSettings {
  if (typeof raw === 'object' && raw !== null) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(raw as NotificationPreferenceSettings),
      mutedCategories: Array.isArray((raw as NotificationPreferenceSettings).mutedCategories)
        ? (raw as NotificationPreferenceSettings).mutedCategories
        : [...DEFAULT_NOTIFICATION_PREFERENCES.mutedCategories],
    };
  }
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    mutedCategories: [...DEFAULT_NOTIFICATION_PREFERENCES.mutedCategories],
  };
}

export const CommunicationPolicyService = {
  async getPolicies(companyId: string): Promise<CommunicationPolicySettings> {
    const policies = await getSettingValue(companyId, COMMUNICATION_POLICY_KEYS.POLICIES);
    return mergePolicies(policies);
  },

  async getSettings(companyId: string): Promise<CommunicationSettings> {
    const [policies, templates, preferences] = await Promise.all([
      getSettingValue(companyId, COMMUNICATION_POLICY_KEYS.POLICIES),
      getSettingValue(companyId, COMMUNICATION_POLICY_KEYS.TEMPLATES),
      getSettingValue(companyId, COMMUNICATION_POLICY_KEYS.PREFERENCES),
    ]);

    return {
      policies: mergePolicies(policies),
      templates: mergeTemplates(templates),
      preferences: mergePreferences(preferences),
    };
  },

  async updatePolicies(
    context: CommunicationActorContext,
    payload: Partial<CommunicationPolicySettings>,
  ): Promise<CommunicationPolicySettings> {
    const before = await this.getPolicies(context.companyId);
    const after = { ...before, ...payload };

    await upsertSetting(
      context.companyId,
      COMMUNICATION_POLICY_KEYS.POLICIES,
      after,
      SETTING_VALUE_TYPE.JSON,
      'Communication module policies',
      context.userId,
    );

    await CommunicationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'communication_policy',
      entityId: context.companyId,
      action: 'update',
      before: before as unknown as Record<string, unknown>,
      after: after,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return after;
  },

  async updateSettings(
    context: CommunicationActorContext,
    payload: {
      policies?: Partial<CommunicationPolicySettings>;
      templates?: AnnouncementTemplate[];
      preferences?: Partial<NotificationPreferenceSettings>;
    },
  ): Promise<CommunicationSettings> {
    const current = await this.getSettings(context.companyId);

    if (payload.policies !== undefined) {
      const merged = { ...current.policies, ...payload.policies };
      await upsertSetting(
        context.companyId,
        COMMUNICATION_POLICY_KEYS.POLICIES,
        merged,
        SETTING_VALUE_TYPE.JSON,
        'Communication policies',
        context.userId,
      );
    }
    if (payload.templates !== undefined) {
      await upsertSetting(
        context.companyId,
        COMMUNICATION_POLICY_KEYS.TEMPLATES,
        payload.templates,
        SETTING_VALUE_TYPE.JSON,
        'Announcement templates',
        context.userId,
      );
    }
    if (payload.preferences !== undefined) {
      const merged = { ...current.preferences, ...payload.preferences };
      await upsertSetting(
        context.companyId,
        COMMUNICATION_POLICY_KEYS.PREFERENCES,
        merged,
        SETTING_VALUE_TYPE.JSON,
        'Notification preferences',
        context.userId,
      );
    }

    return this.getSettings(context.companyId);
  },

  async getPreferencesForUser(companyId: string): Promise<NotificationPreferenceSettings> {
    const settings = await this.getSettings(companyId);
    return settings.preferences;
  },
};
