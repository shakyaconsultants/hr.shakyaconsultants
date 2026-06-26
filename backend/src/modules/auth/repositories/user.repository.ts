import type { ClientSession } from 'mongoose';
import { UserModel, USER_STATUS, type UserDocument } from '@domain/auth/user.schema.js';
import { getEnv } from '@config/env.js';

export const AuthUserRepository = {
  async findByEmailWithPassword(email: string, companyId: string): Promise<UserDocument | null> {
    return UserModel.findOne({
      email: email.toLowerCase(),
      companyId,
      isDeleted: false,
    })
      .select('+passwordHash')
      .exec();
  },

  async findById(userId: string, companyId: string): Promise<UserDocument | null> {
    return UserModel.findOne({ id: userId, companyId, isDeleted: false }).exec();
  },

  async incrementFailedAttempts(userId: string, companyId: string): Promise<UserDocument | null> {
    const env = getEnv();
    const user = await UserModel.findOneAndUpdate(
      { id: userId, companyId, isDeleted: false },
      { $inc: { failedLoginAttempts: 1 } },
      { new: true },
    ).exec();

    if (!user) {
      return null;
    }

    if (user.failedLoginAttempts >= env.AUTH_MAX_FAILED_ATTEMPTS) {
      return UserModel.findOneAndUpdate(
        { id: userId, companyId },
        {
          $set: {
            status: USER_STATUS.LOCKED,
            lockedUntil: new Date(Date.now() + env.AUTH_LOCKOUT_DURATION_MS),
            updatedAt: new Date(),
          },
        },
        { new: true },
      ).exec();
    }

    return user;
  },

  async resetFailedAttempts(userId: string, companyId: string): Promise<void> {
    await UserModel.updateOne(
      { id: userId, companyId },
      {
        $set: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          status: USER_STATUS.ACTIVE,
          updatedAt: new Date(),
        },
      },
    ).exec();
  },

  async lockAccount(userId: string, companyId: string): Promise<void> {
    const env = getEnv();
    await UserModel.updateOne(
      { id: userId, companyId },
      {
        $set: {
          status: USER_STATUS.LOCKED,
          lockedUntil: new Date(Date.now() + env.AUTH_LOCKOUT_DURATION_MS),
          updatedAt: new Date(),
        },
      },
    ).exec();
  },

  async updateLastLogin(userId: string, companyId: string): Promise<void> {
    await UserModel.updateOne(
      { id: userId, companyId },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ).exec();
  },

  async incrementTokenVersion(
    userId: string,
    companyId: string,
    session?: ClientSession,
  ): Promise<number> {
    const updated = await UserModel.findOneAndUpdate(
      { id: userId, companyId },
      { $inc: { tokenVersion: 1 } },
      { new: true, session },
    ).exec();

    return updated?.tokenVersion ?? 0;
  },

  async updatePassword(
    userId: string,
    companyId: string,
    passwordHash: string,
    updatedBy: string,
    session?: ClientSession,
  ): Promise<void> {
    await UserModel.updateOne(
      { id: userId, companyId },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
          mustChangePassword: false,
          updatedBy,
          updatedAt: new Date(),
        },
      },
      { session },
    ).exec();
  },
};
