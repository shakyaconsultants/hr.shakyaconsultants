import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked',
  PENDING: 'pending',
} as const;

export interface UserDocument extends BaseDocument {
  email: string;
  passwordHash: string;
  employeeId?: string;
  roleIds: string[];
  tokenVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  mustChangePassword: boolean;
  status: string;
}

export interface PasswordResetTokenDocument extends BaseDocument {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  ipAddress?: string;
}

/** Password history — ready for future password reuse policy enforcement */
export interface PasswordHistoryDocument extends BaseDocument {
  userId: string;
  passwordHash: string;
  changedAt: Date;
}

const userFields: SchemaDefinition = {
  email: { type: String, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  employeeId: { type: String, index: true },
  roleIds: { type: [String], default: [] },
  tokenVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  mustChangePassword: { type: Boolean, default: false },
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE,
    index: true,
  },
};

const passwordResetTokenFields: SchemaDefinition = {
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null },
  ipAddress: { type: String, trim: true },
};

const passwordHistoryFields: SchemaDefinition = {
  userId: { type: String, required: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  changedAt: { type: Date, required: true, default: Date.now },
};

export const userModel = defineDomainModel<UserDocument>('User', COLLECTIONS.USERS, userFields, {
  indexes: [
    {
      fields: { companyId: 1, email: 1 },
      options: { unique: true, name: 'uq_users_company_email' },
    },
    { fields: { companyId: 1, id: 1 }, options: { unique: true, name: 'uq_users_company_id' } },
    { fields: { companyId: 1, status: 1 }, options: { name: 'idx_users_company_status' } },
  ],
});

export const passwordResetTokenModel = defineDomainModel<PasswordResetTokenDocument>(
  'PasswordResetToken',
  COLLECTIONS.PASSWORD_RESET_TOKENS,
  passwordResetTokenFields,
  {
    indexes: [
      {
        fields: { userId: 1, usedAt: 1 },
        options: { name: 'idx_password_reset_tokens_user_used' },
      },
      {
        fields: { tokenHash: 1 },
        options: { unique: true, name: 'uq_password_reset_tokens_hash' },
      },
      {
        fields: { expiresAt: 1 },
        options: { name: 'idx_password_reset_tokens_expires', expireAfterSeconds: 0 },
      },
    ],
  },
);

export const passwordHistoryModel = defineDomainModel<PasswordHistoryDocument>(
  'PasswordHistory',
  COLLECTIONS.PASSWORD_HISTORY,
  passwordHistoryFields,
  {
    indexes: [
      {
        fields: { companyId: 1, userId: 1, changedAt: -1 },
        options: { name: 'idx_password_history_user_date' },
      },
    ],
  },
);

export const UserModel = userModel.model;
export const PasswordResetTokenModel = passwordResetTokenModel.model;
export const PasswordHistoryModel = passwordHistoryModel.model;

export const UserRepository = userModel.repository;
export const PasswordResetTokenRepository = passwordResetTokenModel.repository;
export const PasswordHistoryRepository = passwordHistoryModel.repository;
