import type { ClientSession } from 'mongoose';
import { getEnv } from '@config/env.js';
import type { DeviceSessionDocument } from '@domain/audit/audit.schemas.js';
import { CacheService } from '@infrastructure/redis/cache.service.js';
import {
  AUTH_CACHE_KEY_PREFIX,
  buildRefreshReplayKey,
} from '@modules/auth/constants/auth.constants.js';
import { AuthSessionRepository } from '@modules/auth/repositories/session.repository.js';
import { SessionCacheService } from '@modules/auth/services/session-cache.service.js';
import { hashRefreshToken, parseExpiresInToMs } from '@modules/auth/services/token.service.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

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

  async findActiveSessionForAuth(
    companyId: string,
    sessionId: string,
  ): Promise<DeviceSessionDocument | null> {
    const cached = SessionCacheService.get(companyId, sessionId);
    if (cached === false) {
      return null;
    }
    if (cached === true) {
      return { sessionId } as DeviceSessionDocument;
    }

    const session = await AuthSessionRepository.findActiveBySessionIdForAuth(companyId, sessionId);
    SessionCacheService.set(companyId, sessionId, session !== null);
    return session;
  },

  async revokeSession(companyId: string, sessionId: string, updatedBy: string): Promise<void> {
    SessionCacheService.invalidate(companyId, sessionId);
    await AuthSessionRepository.revokeSession(companyId, sessionId, updatedBy);
  },

  async revokeAllUserSessions(
    companyId: string,
    userId: string,
    updatedBy: string,
  ): Promise<number> {
    SessionCacheService.invalidateUser(companyId, userId);
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

    await CacheService.setReplayKey(replayKey, replayTtlSeconds);

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
    return CacheService.existsReplayKey(replayKey);
  },

  async updateLastActivity(companyId: string, sessionId: string): Promise<void> {
    await AuthSessionRepository.updateLastActivity(companyId, sessionId);
  },
};

export { AUTH_CACHE_KEY_PREFIX };
