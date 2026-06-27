import { CompanyRepository } from '@domain/company/company.schema.js';
import { AppError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http.constants.js';

const SYSTEM_INIT_CACHE_TTL_MS = 60_000;
let cachedInitialized: boolean | null = null;
let cachedInitializedAt = 0;

export const SystemInitService = {
  async isSystemInitialized(): Promise<boolean> {
    const now = Date.now();
    if (cachedInitialized !== null && now - cachedInitializedAt < SYSTEM_INIT_CACHE_TTL_MS) {
      return cachedInitialized;
    }

    const count = await CompanyRepository.count({});
    cachedInitialized = count > 0;
    cachedInitializedAt = now;
    return cachedInitialized;
  },

  async assertSystemInitialized(): Promise<void> {
    const initialized = await this.isSystemInitialized();
    if (!initialized) {
      throw new AppError({
        code: ERROR_CODES.SYSTEM_NOT_INITIALIZED,
        message: 'System is not initialized. Complete bootstrap setup first.',
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      });
    }
  },
};
