import type { ClientSession } from 'mongoose';
import { DeviceSessionModel, type DeviceSessionDocument } from '@domain/audit/audit.schemas.js';

export interface CreateSessionData extends Partial<DeviceSessionDocument> {
  id: string;
  companyId: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  refreshTokenHash: string;
  createdBy: string;
  updatedBy: string;
  session?: ClientSession;
}

export const AuthSessionRepository = {
  async createSession(data: CreateSessionData): Promise<DeviceSessionDocument> {
    const document = new DeviceSessionModel(data);
    const saved = await document.save({ session: data.session });
    return saved;
  },

  async findActiveBySessionId(
    companyId: string,
    sessionId: string,
  ): Promise<DeviceSessionDocument | null> {
    return DeviceSessionModel.findOne({
      companyId,
      sessionId,
      isActive: true,
      revoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select('+refreshTokenHash')
      .exec();
  },

  async findBySessionId(
    companyId: string,
    sessionId: string,
  ): Promise<DeviceSessionDocument | null> {
    return DeviceSessionModel.findOne({ companyId, sessionId })
      .select('+refreshTokenHash')
      .exec();
  },

  async revokeSession(companyId: string, sessionId: string, updatedBy: string): Promise<void> {
    await DeviceSessionModel.updateOne(
      { companyId, sessionId },
      {
        $set: {
          isActive: false,
          revoked: true,
          revokedAt: new Date(),
          updatedBy,
          updatedAt: new Date(),
        },
      },
    ).exec();
  },

  async revokeAllForUser(companyId: string, userId: string, updatedBy: string): Promise<number> {
    const result = await DeviceSessionModel.updateMany(
      { companyId, userId, isActive: true, revoked: false },
      {
        $set: {
          isActive: false,
          revoked: true,
          revokedAt: new Date(),
          updatedBy,
          updatedAt: new Date(),
        },
      },
    ).exec();

    return result.modifiedCount;
  },

  async updateRefreshTokenHash(
    companyId: string,
    sessionId: string,
    refreshTokenHash: string,
    updatedBy: string,
  ): Promise<void> {
    await DeviceSessionModel.updateOne(
      { companyId, sessionId },
      {
        $set: {
          refreshTokenHash,
          lastActiveAt: new Date(),
          updatedBy,
          updatedAt: new Date(),
        },
      },
    ).exec();
  },

  async updateLastActivity(companyId: string, sessionId: string): Promise<void> {
    await DeviceSessionModel.updateOne(
      { companyId, sessionId },
      {
        $set: {
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ).exec();
  },

  async findActiveForUser(companyId: string, userId: string): Promise<DeviceSessionDocument[]> {
    return DeviceSessionModel.find({
      companyId,
      userId,
      isActive: true,
      revoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastActiveAt: -1 })
      .exec();
  },

  async findHistoryForUser(companyId: string, userId: string, limit = 20): Promise<DeviceSessionDocument[]> {
    return DeviceSessionModel.find({ companyId, userId })
      .sort({ loggedInAt: -1 })
      .limit(limit)
      .exec();
  },
};
