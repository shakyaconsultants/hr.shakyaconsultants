import type { ClientSession } from 'mongoose';
import {
  PasswordResetTokenModel,
  type PasswordResetTokenDocument,
} from '@domain/auth/user.schema.js';

export const AuthPasswordResetRepository = {
  async createToken(
    data: {
      id: string;
      companyId: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress?: string;
      createdBy: string;
      updatedBy: string;
    },
    session?: ClientSession,
  ): Promise<PasswordResetTokenDocument> {
    const document = new PasswordResetTokenModel(data);
    const saved = await document.save({ session });
    return saved;
  },

  async findValidByHash(tokenHash: string): Promise<PasswordResetTokenDocument | null> {
    return PasswordResetTokenModel.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .select('+tokenHash')
      .exec();
  },

  async markUsed(tokenId: string, session?: ClientSession): Promise<void> {
    await PasswordResetTokenModel.updateOne(
      { id: tokenId },
      { $set: { usedAt: new Date(), updatedAt: new Date() } },
      { session },
    ).exec();
  },

  async invalidateUserTokens(userId: string, companyId: string): Promise<void> {
    await PasswordResetTokenModel.updateMany(
      { userId, companyId, usedAt: null },
      { $set: { usedAt: new Date(), updatedAt: new Date() } },
    ).exec();
  },
};
