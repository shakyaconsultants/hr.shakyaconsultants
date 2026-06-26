import { CompanyRepository } from '@domain/company/company.schema.js';
import { AppError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http.constants.js';

export const SystemInitService = {
  async isSystemInitialized(): Promise<boolean> {
    const count = await CompanyRepository.count({});
    return count > 0;
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
