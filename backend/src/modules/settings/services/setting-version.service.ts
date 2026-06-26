import {
  AppSettingRepository,
  SettingVersionRepository,
} from '@domain/master-data/master-data.schemas.js';
import type { AppSettingDocument, SettingVersionDocument } from '@domain/master-data/master-data.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface RecordVersionInput {
  companyId: string;
  setting: AppSettingDocument;
  changedBy: string;
  changeReason?: string;
}

export interface SettingHistoryQuery {
  page?: number;
  pageSize?: number;
}

export const SettingVersionService = {
  async recordVersion(input: RecordVersionInput): Promise<SettingVersionDocument> {
    const { companyId, setting, changedBy, changeReason } = input;
    const latestVersion = await SettingVersionRepository.findMany(
      { settingId: setting.id },
      { companyId },
    );
    const nextVersion =
      latestVersion.length > 0
        ? Math.max(...latestVersion.map((v) => v.version)) + 1
        : 1;

    return SettingVersionRepository.create(
      {
        id: generateUuid(),
        companyId,
        settingId: setting.id,
        settingKey: setting.key,
        value: setting.value,
        valueType: setting.valueType,
        version: nextVersion,
        changedBy,
        changeReason,
        createdAt: new Date(),
        createdBy: changedBy,
        updatedBy: changedBy,
      },
      { companyId },
    );
  },

  async getHistoryByKey(
    companyId: string,
    key: string,
    query: SettingHistoryQuery = {},
  ): Promise<PaginatedResult<SettingVersionDocument>> {
    const setting = await AppSettingRepository.findOne({ key: key.toLowerCase() }, { companyId });
    if (!setting) {
      throw new NotFoundError('Setting not found', ERROR_CODES.NOT_FOUND);
    }

    return SettingVersionRepository.paginate(
      { settingKey: key.toLowerCase() },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'version',
        sortOrder: 'desc',
        companyId,
      },
      { companyId },
    );
  },
};
