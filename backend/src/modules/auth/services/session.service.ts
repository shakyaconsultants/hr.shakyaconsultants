import type { ClientSession } from 'mongoose';
import { getEnv } from '@config/env.js';
import type { DeviceSessionDocument } from '@domain/audit/audit.schemas.js';
import { CacheService } from '@infrastructure/redis/cache.service.js';
import {
  AUTH_CACHE_KEY_PREFIX,
  buildRefreshReplayKey,
} from '@modules/auth/constants/auth.constants.js';
import { AuthSessionRepository } from '@modules/auth/repositories/session.repository.js';
import { hashRefreshToken, parseExpiresInToMs } from '@modules/auth/services/token.service.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

export interface ParsedUserAgent {
  browser: string;
  os: string;
  platform: string;
}

export interface CreateSessionInput {
  userId: string;
  companyId: string;
  sessionId?: string;
  deviceId: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
  refreshToken: string;
  rememberMe: boolean;
  createdBy: string;
  session?: ClientSession;
}

export const SessionService = {
  parseUserAgent(userAgent: string): ParsedUserAgent {
    const ua = userAgent.toLowerCase();
    let browser = 'Unknown';
    let os = 'Unknown';
    let platform = 'web';

    if (ua.includes('edg/')) {
      browser = 'Edge';
    } else if (ua.includes('chrome/')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox/')) {
      browser = 'Firefox';
    } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
      browser = 'Safari';
    }

    if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('mac os')) {
      os = 'macOS';
    } else if (ua.includes('android')) {
      os = 'Android';
      platform = 'mobile';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
      platform = 'mobile';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    }

    return { browser, os, platform };
  },

  async createSession(
    input: CreateSessionInput & { sessionId?: string },
  ): Promise<DeviceSessionDocument> {
    const env = getEnv();
    const sessionId = input.sessionId ?? generateUuid();
    const parsed = this.parseUserAgent(input.userAgent);
    const refreshMs = input.rememberMe
      ? env.AUTH_REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000
      : parseExpiresInToMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshMs);

    return AuthSessionRepository.createSession({
      id: generateUuid(),
      companyId: input.companyId,
      userId: input.userId,
      sessionId,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      browser: parsed.browser,
      os: parsed.os,
      platform: parsed.platform,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      refreshTokenHash: hashRefreshToken(input.refreshToken),
      loggedInAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt,
      rememberMe: input.rememberMe,
      isActive: true,
      revoked: false,
      revokedAt: null,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      session: input.session,
    });
  },

  async findActiveSession(
    companyId: string,
    sessionId: string,
  ): Promise<DeviceSessionDocument | null> {
    return AuthSessionRepository.findActiveBySessionId(companyId, sessionId);
  },

  async revokeSession(
    companyId: string,
    sessionId: string,
    updatedBy: string,
  ): Promise<void> {
    await AuthSessionRepository.revokeSession(companyId, sessionId, updatedBy);
  },

  async revokeAllUserSessions(
    companyId: string,
    userId: string,
    updatedBy: string,
  ): Promise<number> {
    return AuthSessionRepository.revokeAllForUser(companyId, userId, updatedBy);
  },

  async rotateRefreshToken(params: {
    companyId: string;
    sessionId: string;
    oldJti: string;
    newRefreshToken: string;
    updatedBy: string;
  }): Promise<void> {
    const env = getEnv();
    const replayKey = buildRefreshReplayKey(env.QUEUE_PREFIX, params.oldJti);
    const replayTtlSeconds = Math.ceil(parseExpiresInToMs(env.JWT_REFRESH_EXPIRES_IN) / 1000);

    await CacheService.set(replayKey, '1', replayTtlSeconds);

    await AuthSessionRepository.updateRefreshTokenHash(
      params.companyId,
      params.sessionId,
      hashRefreshToken(params.newRefreshToken),
      params.updatedBy,
    );
  },

  async isRefreshReplay(jti: string): Promise<boolean> {
    const env = getEnv();
    const replayKey = buildRefreshReplayKey(env.QUEUE_PREFIX, jti);
    return CacheService.exists(replayKey);
  },

  async updateLastActivity(companyId: string, sessionId: string): Promise<void> {
    await AuthSessionRepository.updateLastActivity(companyId, sessionId);
  },

  async listActiveSessions(companyId: string, userId: string, currentSessionId: string) {
    const sessions = await AuthSessionRepository.findActiveForUser(companyId, userId);
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      platform: session.platform,
      ipAddress: session.ipAddress,
      loggedInAt: session.loggedInAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === currentSessionId,
    }));
  },

  async listSessionHistory(companyId: string, userId: string) {
    const sessions = await AuthSessionRepository.findHistoryForUser(companyId, userId);
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      platform: session.platform,
      ipAddress: session.ipAddress,
      loggedInAt: session.loggedInAt,
      lastActiveAt: session.lastActiveAt,
      revoked: session.revoked,
      revokedAt: session.revokedAt,
    }));
  },

  async revokeUserSession(
    companyId: string,
    userId: string,
    sessionId: string,
    updatedBy: string,
    currentSessionId: string,
  ): Promise<void> {
    const session = await AuthSessionRepository.findBySessionId(companyId, sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Session not found', ERROR_CODES.NOT_FOUND);
    }
    await AuthSessionRepository.revokeSession(companyId, sessionId, updatedBy);
    if (sessionId === currentSessionId) {
      return;
    }
  },
};

export { AUTH_CACHE_KEY_PREFIX };
