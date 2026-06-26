import { SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import {
  DEFAULT_NAVIGATION_ITEMS,
  NAVIGATION_SETTING_KEY,
  type NavigationItemDefault,
} from '@modules/settings/constants/navigation-defaults.constants.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import { MasterDataCacheService } from '@modules/organization/shared/master-data-cache.service.js';

export interface NavigationOverride {
  id: string;
  enabled: boolean;
  sortOrder: number;
  groupId: string;
  icon?: string;
  portals?: string[];
  permission?: string;
}

export interface EffectiveNavigationItem extends NavigationItemDefault {
  overridden: boolean;
}

export const NavigationConfigService = {
  async getOverrides(companyId: string): Promise<NavigationOverride[]> {
    try {
      const setting = await SettingsService.getByKey(companyId, NAVIGATION_SETTING_KEY);
      if (Array.isArray(setting.value)) {
        return setting.value as NavigationOverride[];
      }
      return [];
    } catch {
      return [];
    }
  },

  async getEffectiveNavigation(companyId: string): Promise<EffectiveNavigationItem[]> {
    const overrides = await this.getOverrides(companyId);
    const overrideMap = new Map(overrides.map((o) => [o.id, o]));

    const merged = DEFAULT_NAVIGATION_ITEMS.map((item) => {
      const override = overrideMap.get(item.id);
      if (!override) {
        return { ...item, overridden: false };
      }
      return {
        ...item,
        enabled: override.enabled,
        sortOrder: override.sortOrder,
        groupId: override.groupId,
        icon: override.icon ?? item.icon,
        portals: override.portals ?? item.portals,
        permission: override.permission ?? item.permission,
        overridden: true,
      };
    });

    for (const override of overrides) {
      if (!merged.some((item) => item.id === override.id)) {
        merged.push({
          id: override.id,
          label: override.id,
          groupId: override.groupId,
          enabled: override.enabled,
          sortOrder: override.sortOrder,
          icon: override.icon,
          portals: override.portals,
          permission: override.permission,
          overridden: true,
        });
      }
    }

    return merged.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async saveOverrides(
    companyId: string,
    overrides: NavigationOverride[],
    context: MasterDataActorContext,
  ): Promise<NavigationOverride[]> {
    const existing = await AppSettingRepository.findOne({ key: NAVIGATION_SETTING_KEY }, { companyId });

    if (existing) {
      await SettingsService.update(
        companyId,
        NAVIGATION_SETTING_KEY,
        { value: overrides },
        context,
      );
    } else {
      await AppSettingRepository.create(
        {
          id: generateUuid(),
          companyId,
          key: NAVIGATION_SETTING_KEY,
          name: 'Navigation Menu Overrides',
          value: overrides,
          valueType: SETTING_VALUE_TYPE.JSON,
          group: SETTING_GROUP.NAVIGATION,
          description: 'Custom navigation menu configuration',
          isEditable: true,
          isPublic: false,
          encrypted: false,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId },
      );
      await MasterDataCacheService.invalidateEntity(companyId, 'settings');
    }

    return overrides;
  },
};
