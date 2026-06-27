import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import { SequenceModel } from '@domain/employee/employee-subresource.schemas.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import {
  CODE_GENERATION_REGISTRY,
  GLOBAL_CODE_SETTINGS,
  entitySupportsAutoCode,
  slugifyForCode,
} from '@modules/organization/constants/code-generation.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

async function readSetting(companyId: string, key: string): Promise<unknown> {
  const setting = await AppSettingRepository.findOne({ key }, { companyId });
  return setting?.value;
}

async function readBooleanSetting(companyId: string, key: string, defaultValue: boolean): Promise<boolean> {
  const value = await readSetting(companyId, key);
  if (typeof value === 'boolean') return value;
  return defaultValue;
}

async function readNumberSetting(companyId: string, key: string, defaultValue: number): Promise<number> {
  const value = await readSetting(companyId, key);
  if (typeof value === 'number' && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return defaultValue;
}

async function readPrefix(companyId: string, settingKey: string, defaultPrefix: string): Promise<string> {
  const value = await readSetting(companyId, settingKey);
  if (typeof value === 'string' && value.trim()) {
    return value.trim().toUpperCase();
  }
  return defaultPrefix;
}

function buildDateSegments(includeYear: boolean, includeMonth: boolean): string[] {
  const now = new Date();
  const segments: string[] = [];
  if (includeYear) {
    segments.push(String(now.getFullYear()).slice(-2));
  }
  if (includeMonth) {
    segments.push(String(now.getMonth() + 1).padStart(2, '0'));
  }
  return segments;
}

export const CodeGenerationService = {
  entitySupportsAutoCode,

  async generate(
    companyId: string,
    userId: string,
    entityKey: MasterDataEntityKey,
    name?: string,
  ): Promise<string> {
    const config = CODE_GENERATION_REGISTRY[entityKey];
    if (!config) {
      throw new Error(`Code generation is not configured for entity: ${entityKey}`);
    }

    const [prefix, padLength, includeYear, includeMonth] = await Promise.all([
      readPrefix(companyId, config.prefixSettingKey, config.defaultPrefix),
      readNumberSetting(companyId, GLOBAL_CODE_SETTINGS.PAD_LENGTH, config.padLength),
      readBooleanSetting(companyId, GLOBAL_CODE_SETTINGS.INCLUDE_YEAR, config.includeYear),
      readBooleanSetting(companyId, GLOBAL_CODE_SETTINGS.INCLUDE_MONTH, config.includeMonth),
    ]);

    const sequenceKey = `master-data:${entityKey}`;
    const sequence = await SequenceModel.findOneAndUpdate(
      { companyId, key: sequenceKey },
      {
        $inc: { value: 1 },
        $setOnInsert: {
          id: generateUuid(),
          companyId,
          key: sequenceKey,
          prefix,
          createdBy: userId,
          updatedBy: userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    const segments: string[] = [prefix];

    if (config.slugFromName && name?.trim()) {
      const slug = slugifyForCode(name);
      if (slug) segments.push(slug);
    }

    segments.push(...buildDateSegments(includeYear, includeMonth));

    const running = String(sequence.value).padStart(padLength, '0');
    segments.push(running);

    if (config.suffix) {
      segments.push(config.suffix);
    }

    return segments.join('-');
  },

  async ensureUnique(
    companyId: string,
    userId: string,
    entityKey: MasterDataEntityKey,
    name: string | undefined,
    exists: (code: string) => Promise<boolean>,
    maxAttempts = 5,
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const code = await this.generate(companyId, userId, entityKey, name);
      const taken = await exists(code);
      if (!taken) {
        return code;
      }
    }
    throw new Error(`Unable to generate unique code for ${entityKey}`);
  },
};
