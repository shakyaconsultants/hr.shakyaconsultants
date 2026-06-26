import { LoginHistoryRepository } from '@domain/audit/audit.schemas.js';
import { AuthLoginHistoryRepository } from '@modules/auth/repositories/login-history.repository.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

export interface RecordLoginAttemptInput {
  userId: string;
  companyId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  correlationId: string;
  failureReason?: string;
  createdBy: string;
}

export const LoginHistoryService = {
  async recordLoginAttempt(input: RecordLoginAttemptInput): Promise<void> {
    await AuthLoginHistoryRepository.recordAttempt({
      id: generateUuid(),
      companyId: input.companyId,
      userId: input.userId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      success: input.success,
      failureReason: input.failureReason,
      correlationId: input.correlationId,
      loggedInAt: new Date(),
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    });
  },
};

export { LoginHistoryRepository };
