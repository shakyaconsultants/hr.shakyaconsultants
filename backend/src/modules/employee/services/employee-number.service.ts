import { SequenceModel } from '@domain/employee/employee-subresource.schemas.js';
import {
  DEFAULT_EMPLOYEE_NUMBER_PREFIX,
  EMPLOYEE_NUMBER_SEQUENCE_KEY,
  EMPLOYEE_SETTINGS_KEYS,
} from '@modules/employee/constants/employee.constants.js';
import { AppSettingRepository } from '@domain/master-data/master-data.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

async function resolvePrefix(companyId: string): Promise<string> {
  const setting = await AppSettingRepository.findOne(
    { key: EMPLOYEE_SETTINGS_KEYS.NUMBER_PREFIX },
    { companyId },
  );
  if (setting && typeof setting.value === 'string' && setting.value.trim()) {
    return setting.value.trim().toUpperCase();
  }
  return DEFAULT_EMPLOYEE_NUMBER_PREFIX;
}

async function resolvePadLength(companyId: string): Promise<number> {
  const setting = await AppSettingRepository.findOne(
    { key: EMPLOYEE_SETTINGS_KEYS.NUMBER_PAD_LENGTH },
    { companyId },
  );
  if (setting && typeof setting.value === 'number' && setting.value > 0) {
    return setting.value;
  }
  if (setting && typeof setting.value === 'string') {
    const parsed = Number.parseInt(setting.value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 5;
}

export const EmployeeNumberService = {
  async generate(companyId: string, userId: string): Promise<string> {
    const prefix = await resolvePrefix(companyId);
    const padLength = await resolvePadLength(companyId);

    const sequence = await SequenceModel.findOneAndUpdate(
      { companyId, key: EMPLOYEE_NUMBER_SEQUENCE_KEY },
      {
        $inc: { value: 1 },
        $setOnInsert: {
          id: generateUuid(),
          companyId,
          key: EMPLOYEE_NUMBER_SEQUENCE_KEY,
          prefix,
          createdBy: userId,
          updatedBy: userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    const nextValue = sequence.value;
    const padded = String(nextValue).padStart(padLength, '0');
    return `${prefix}${padded}`;
  },
};
