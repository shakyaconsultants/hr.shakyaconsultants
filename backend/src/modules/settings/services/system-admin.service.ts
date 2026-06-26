import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getEnv } from '@config/env.js';
import { MONGODB_HEALTH } from '@shared/constants/health.constants.js';
import { getMongoConnectionState } from '@infrastructure/database/mongodb.connection.js';
import { checkRedisHealth } from '@infrastructure/redis/redis.client.js';
import { getQueueHealthStatus } from '@infrastructure/queue/bullmq.connection.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import { SETTING_GROUP } from '@domain/master-data/master-data.schemas.js';
import { BadRequestError } from '@shared/errors/app.error.js';
import type { HealthCheckData } from '@shared/types/api.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getMongoHealthStatus(): typeof MONGODB_HEALTH.HEALTHY | typeof MONGODB_HEALTH.UNHEALTHY {
  return getMongoConnectionState() === 1 ? MONGODB_HEALTH.HEALTHY : MONGODB_HEALTH.UNHEALTHY;
}

function readPackageVersion(): string {
  try {
    const packagePath = join(__dirname, '../../../../package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8')) as { version?: string };
    return pkg.version ?? getEnv().APP_VERSION;
  } catch {
    return getEnv().APP_VERSION;
  }
}

export interface SystemHealthResponse extends HealthCheckData {
  status: 'healthy' | 'degraded';
}

export interface StorageInfo {
  provider: string;
  quotaMb: number;
  usedMb: number | null;
  message: string;
}

export interface AppInfo {
  name: string;
  version: string;
  environment: string;
  nodeVersion: string;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
}

const REQUIRED_SMTP_KEYS = ['email.smtp_host', 'email.from_address'];

export const SystemAdminService = {
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const mongodb = getMongoHealthStatus();
    const redis = await checkRedisHealth();
    const queue = getQueueHealthStatus();

    return {
      mongodb,
      redis,
      queue,
      status: mongodb === MONGODB_HEALTH.HEALTHY ? 'healthy' : 'degraded',
    };
  },

  async getStorageInfo(companyId: string): Promise<StorageInfo> {
    let provider = 'cloudinary';
    let quotaMb = 1024;

    try {
      const providerSetting = await SettingsService.getByKey(companyId, 'storage.provider');
      if (typeof providerSetting.value === 'string') {
        provider = providerSetting.value;
      }
    } catch {
      // use defaults
    }

    try {
      const quotaSetting = await SettingsService.getByKey(companyId, 'storage.cloudinary_quota_mb');
      if (typeof quotaSetting.value === 'number') {
        quotaMb = quotaSetting.value;
      }
    } catch {
      // use defaults
    }

    return {
      provider,
      quotaMb,
      usedMb: null,
      message: 'Storage usage metrics are not yet integrated',
    };
  },

  getAppInfo(): AppInfo {
    const env = getEnv();
    return {
      name: env.APP_NAME,
      version: readPackageVersion(),
      environment: env.NODE_ENV,
      nodeVersion: process.version,
    };
  },

  async getEmailQueueStatus(companyId: string): Promise<{ queue: string; emailSettingsConfigured: boolean }> {
    const queue = getQueueHealthStatus();
    const emailSettings = await SettingsService.getByGroup(companyId, SETTING_GROUP.EMAIL);
    const settingsByKey = new Map(emailSettings.map((s) => [s.key, s]));
    const emailSettingsConfigured = REQUIRED_SMTP_KEYS.every((key) => {
      const setting = settingsByKey.get(key);
      if (!setting?.value) {
        return false;
      }
      return typeof setting.value !== 'string' || setting.value.trim() !== '';
    });

    return { queue, emailSettingsConfigured };
  },

  async testEmail(companyId: string): Promise<EmailTestResult> {
    const emailSettings = await SettingsService.getByGroup(companyId, SETTING_GROUP.EMAIL);
    const settingsByKey = new Map(emailSettings.map((s) => [s.key, s]));

    const missing = REQUIRED_SMTP_KEYS.filter((key) => {
      const setting = settingsByKey.get(key);
      return !setting?.value || (typeof setting.value === 'string' && setting.value.trim() === '');
    });

    if (missing.length > 0) {
      throw new BadRequestError(`Missing required SMTP settings: ${missing.join(', ')}`);
    }

    return {
      success: true,
      message: 'SMTP settings validated. Email delivery test is not yet implemented.',
    };
  },
};
