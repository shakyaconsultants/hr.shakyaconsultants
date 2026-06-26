import { LoginHistoryModel, type LoginHistoryDocument } from '@domain/audit/audit.schemas.js';

export interface RecordLoginAttemptData {
  id: string;
  companyId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  correlationId: string;
  loggedInAt: Date;
  createdBy: string;
  updatedBy: string;
}

export const AuthLoginHistoryRepository = {
  async recordAttempt(data: RecordLoginAttemptData): Promise<LoginHistoryDocument> {
    const document = new LoginHistoryModel(data);
    const saved = await document.save();
    return saved;
  },
};
