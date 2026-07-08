import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getEnv } from '@config/env.js';
import { MONGODB_HEALTH } from '@shared/constants/health.constants.js';
import { getMongoConnectionState } from '@infrastructure/database/mongodb.connection.js';
import { EmailService } from '@infrastructure/email/email.service.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import { BadRequestError } from '@shared/errors/app.error.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import type { HealthCheckData } from '@shared/types/api.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getMongoHealthStatus(): typeof MONGODB_HEALTH.HEALTHY | typeof MONGODB_HEALTH.UNHEALTHY {
  return getMongoConnectionState() === 1 ? MONGODB_HEALTH.HEALTHY : MONGODB_HEALTH.UNHEALTHY;
}

function isSmtpConfigured(): boolean {
  const env = getEnv();
  return (
    env.SMTP_PASSWORD !== 'not-configured' &&
    !env.SMTP_HOST.includes('example.com') &&
    env.SMTP_USER.trim().length > 0 &&
    env.SMTP_FROM_EMAIL.trim().length > 0
  );
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

export interface EmailDeliveryStatus {
  configured: boolean;
  mode: 'direct';
}

export const SystemAdminService = {
  getEmailDeliveryStatus(): EmailDeliveryStatus {
    return {
      configured: isSmtpConfigured(),
      mode: 'direct',
    };
  },

  getSystemHealth(): SystemHealthResponse {
    const mongodb = getMongoHealthStatus();
    const email = isSmtpConfigured() ? 'direct' : 'unconfigured';

    return {
      mongodb,
      email,
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

  getEmailQueueStatus(_companyId: string): { queue: string; emailSettingsConfigured: boolean } {
    const configured = isSmtpConfigured();
    return { queue: 'direct', emailSettingsConfigured: configured };
  },

  async testEmail(companyId: string): Promise<EmailTestResult> {
    if (!isSmtpConfigured()) {
      throw new BadRequestError(
        'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL in backend environment.',
      );
    }

    let to = getEnv().SMTP_FROM_EMAIL;
    try {
      const fromSetting = await SettingsService.getByKey(companyId, 'email.from_address');
      if (typeof fromSetting.value === 'string' && fromSetting.value.trim()) {
        to = fromSetting.value.trim();
      }
    } catch {
      // use env default
    }

    const correlationId = getCorrelationId() ?? 'system';
    await EmailService.send({
      to,
      subject: `${getEnv().APP_NAME} — SMTP test`,
      html: `<p>This is a test email from ${getEnv().APP_NAME}. SMTP direct delivery is working.</p>`,
      text: `This is a test email from ${getEnv().APP_NAME}. SMTP direct delivery is working.`,
      correlationId,
      tenantId: companyId,
    });

    return {
      success: true,
      message: `Test email sent to ${to}`,
    };
  },
};
