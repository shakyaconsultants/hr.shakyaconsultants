import { SETTING_GROUP } from '@domain/master-data/master-data.schemas.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import type { AppSettingDocument } from '@domain/master-data/master-data.schemas.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';
import { CONFIGURATION_CATALOG_BY_GROUP } from '@modules/settings/constants/configuration-catalog.constants.js';
import { BadRequestError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';

const FEATURE_FLAG_PREFIX = 'feature.';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  isPublic: boolean;
}

export const FeatureFlagService = {
  async list(companyId: string): Promise<FeatureFlag[]> {
    const catalogDefs = CONFIGURATION_CATALOG_BY_GROUP[SETTING_GROUP.FEATURE_FLAGS] ?? [];
    const settings = await SettingsService.getByGroup(companyId, SETTING_GROUP.FEATURE_FLAGS);
    const settingsByKey = new Map(settings.map((s) => [s.key, s]));

    const flags: FeatureFlag[] = catalogDefs.map((def) => {
      const setting = settingsByKey.get(def.key);
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        enabled: setting ? Boolean(setting.value) : Boolean(def.defaultValue),
        isPublic: def.isPublic ?? false,
      };
    });

    for (const setting of settings) {
      if (!setting.key.startsWith(FEATURE_FLAG_PREFIX)) {
        continue;
      }
      if (flags.some((f) => f.key === setting.key)) {
        continue;
      }
      flags.push({
        key: setting.key,
        name: setting.name ?? setting.key,
        description: setting.description ?? '',
        enabled: Boolean(setting.value),
        isPublic: setting.isPublic,
      });
    }

    return flags.sort((a, b) => a.key.localeCompare(b.key));
  },

  async toggle(
    companyId: string,
    flagKey: string,
    enabled: boolean,
    context: MasterDataActorContext,
  ): Promise<AppSettingDocument> {
    const normalizedKey = flagKey.toLowerCase();
    if (!normalizedKey.startsWith(FEATURE_FLAG_PREFIX)) {
      throw new BadRequestError('Feature flag key must start with "feature."');
    }

    const existing = await AppSettingRepository.findOne({ key: normalizedKey }, { companyId });
    if (existing) {
      return SettingsService.update(
        companyId,
        normalizedKey,
        { value: enabled },
        context,
      );
    }

    const catalogDef = CONFIGURATION_CATALOG_BY_GROUP[SETTING_GROUP.FEATURE_FLAGS]?.find(
      (d) => d.key === normalizedKey,
    );

    if (!catalogDef) {
      throw new NotFoundError('Feature flag not found', ERROR_CODES.NOT_FOUND);
    }

    return SettingsService.create(
      companyId,
      {
        key: normalizedKey,
        name: catalogDef.name,
        value: enabled,
        valueType: 'boolean',
        group: SETTING_GROUP.FEATURE_FLAGS,
        description: catalogDef.description,
        isEditable: true,
        isPublic: catalogDef.isPublic ?? false,
        encrypted: false,
      },
      context,
    );
  },
};
