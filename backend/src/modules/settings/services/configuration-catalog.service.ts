import {
  CONFIGURATION_CATALOG,
  CONFIGURATION_CATALOG_BY_GROUP,
  CONFIGURATION_SECTIONS,
  type ConfigurationSection,
  type ConfigurationSettingDefinition,
} from '@modules/settings/constants/configuration-catalog.constants.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';

export interface CatalogEntry extends ConfigurationSettingDefinition {
  currentValue?: unknown;
  settingId?: string;
}

export interface CatalogSection extends ConfigurationSection {
  settings: CatalogEntry[];
}

export interface SeedDefaultsResult {
  created: number;
  skipped: number;
  updated: number;
}

export const ConfigurationCatalogService = {
  getSections(): ConfigurationSection[] {
    return CONFIGURATION_SECTIONS;
  },

  async getCatalog(companyId: string): Promise<CatalogSection[]> {
    const existingSettings = await AppSettingRepository.findMany({}, { companyId });
    const settingsByKey = new Map(existingSettings.map((s) => [s.key, s]));

    return CONFIGURATION_SECTIONS.map((section) => ({
      ...section,
      settings: (CONFIGURATION_CATALOG_BY_GROUP[section.group] ?? []).map((def) => {
        const existing = settingsByKey.get(def.key);
        return {
          ...def,
          currentValue: existing?.value ?? def.defaultValue,
          settingId: existing?.id,
        };
      }),
    }));
  },

  async getCatalogFlat(companyId: string): Promise<CatalogEntry[]> {
    const sections = await this.getCatalog(companyId);
    return sections.flatMap((section) => section.settings);
  },

  async seedDefaults(
    companyId: string,
    context: MasterDataActorContext,
  ): Promise<SeedDefaultsResult> {
    const result: SeedDefaultsResult = { created: 0, skipped: 0, updated: 0 };

    for (const def of CONFIGURATION_CATALOG) {
      const existing = await AppSettingRepository.findOne({ key: def.key }, { companyId });

      if (!existing) {
        await SettingsService.create(
          companyId,
          {
            key: def.key,
            name: def.name,
            category: def.category,
            value: def.defaultValue,
            valueType: def.valueType,
            defaultValue: def.defaultValue,
            group: def.group,
            description: def.description,
            isEditable: true,
            isPublic: def.isPublic ?? false,
            validation: def.validation ?? {},
            encrypted: def.encrypted ?? false,
          },
          context,
        );
        result.created += 1;
        continue;
      }

      const metadataChanged =
        existing.description !== def.description ||
        JSON.stringify(existing.defaultValue) !== JSON.stringify(def.defaultValue);

      if (metadataChanged) {
        await AppSettingRepository.update(
          existing.id,
          {
            $set: {
              name: def.name,
              category: def.category,
              description: def.description,
              defaultValue: def.defaultValue,
              updatedBy: context.userId,
            },
          },
          { companyId, updatedBy: context.userId },
        );
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    }

    return result;
  },

  getDefinitionByKey(key: string): ConfigurationSettingDefinition | undefined {
    return CONFIGURATION_CATALOG.find((item) => item.key === key);
  },
};
