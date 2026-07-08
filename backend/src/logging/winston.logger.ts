import { getEnv } from '@config/env.js';
import { LogCategory } from '@shared/enums/index.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { redactUnknown } from '@shared/utils/sensitive-redact.util.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'http';
type LogMeta = Record<string, unknown>;

interface CategoryLogger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  http(message: string, meta?: unknown): void;
  add(): void;
}

function shouldLog(level: LogLevel): boolean {
  const env = getEnv();
  const configured = env.LOG_LEVEL;
  const order: LogLevel[] = ['debug', 'http', 'info', 'warn', 'error'];
  const minIndex = order.indexOf(configured);
  const levelIndex = order.indexOf(level);
  if (minIndex === -1) {
    return levelIndex >= order.indexOf('info');
  }
  return levelIndex >= minIndex;
}

function writeLog(level: LogLevel, category: LogCategory, message: string, meta?: unknown): void {
  if (!shouldLog(level)) {
    return;
  }

  const correlationId = getCorrelationId();
  const payload = redactUnknown({
    ...(meta && typeof meta === 'object' ? meta : {}),
    ...(correlationId ? { correlationId } : {}),
    service: getEnv().APP_NAME,
    category,
  }) as LogMeta;

  const ts = new Date().toISOString();
  const suffix = Object.keys(payload).length > 0 ? ` ${JSON.stringify(payload)}` : '';
  const line = `${ts} [${level}] ${message}${suffix}`;

  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

function createCategoryLogger(category: LogCategory): CategoryLogger {
  return {
    debug(message, meta) {
      writeLog('debug', category, message, meta);
    },
    info(message, meta) {
      writeLog('info', category, message, meta);
    },
    warn(message, meta) {
      writeLog('warn', category, message, meta);
    },
    error(message, meta) {
      writeLog('error', category, message, meta);
    },
    http(message, meta) {
      writeLog('http', category, message, meta);
    },
    add() {
      // Compatibility with previous Winston API — console logging needs no extra transports.
    },
  };
}

export const logger = createCategoryLogger(LogCategory.Application);
export const auditLogger = createCategoryLogger(LogCategory.Audit);
export const securityLogger = createCategoryLogger(LogCategory.Security);
export const httpLogger = createCategoryLogger(LogCategory.Http);
export const queueLogger = createCategoryLogger(LogCategory.Infrastructure);
export const infraLogger = queueLogger;
export const databaseLogger = createCategoryLogger(LogCategory.Database);
export const errorLogger = createCategoryLogger(LogCategory.Error);

export function logAudit(action: string, meta: Record<string, unknown>): void {
  auditLogger.info(action, meta);
}
