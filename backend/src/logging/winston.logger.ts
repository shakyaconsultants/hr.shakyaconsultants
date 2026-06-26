import path from 'node:path';
import fs from 'node:fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getEnv } from '@config/env.js';
import { LogCategory } from '@shared/enums/index.js';
import { getCorrelationId } from '@shared/context/request.context.js';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

function ensureLogDir(logDir: string): string {
  const resolved = path.isAbsolute(logDir) ? logDir : path.resolve(process.cwd(), logDir);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

function correlationFormat() {
  return winston.format((info) => {
    const correlationId = getCorrelationId();
    if (correlationId) {
      info.correlationId = correlationId;
    }
    return info;
  })();
}

function createDailyTransport(filename: string, level?: string): DailyRotateFile {
  const env = getEnv();
  const logDir = ensureLogDir(env.LOG_DIR);

  return new DailyRotateFile({
    dirname: logDir,
    filename: `${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
  });
}

const consoleFormat = printf((info) => {
  const { level, message, timestamp: ts, ...meta } = info;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const tsStr = typeof ts === 'string' ? ts : JSON.stringify(ts);
  const levelStr = typeof level === 'string' ? level : JSON.stringify(level);
  const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
  return `${tsStr} [${levelStr}]: ${msgStr}${metaStr}`;
});

const baseFormat = combine(errors({ stack: true }), correlationFormat(), timestamp(), json());

function createCategoryLogger(category: LogCategory, filename: string, level?: string): winston.Logger {
  return winston.createLogger({
    level: level ?? getEnv().LOG_LEVEL,
    format: baseFormat,
    defaultMeta: { service: getEnv().APP_NAME, category },
    transports: [createDailyTransport(filename, level)],
  });
}

export const logger = createCategoryLogger(LogCategory.Application, 'application');
export const auditLogger = createCategoryLogger(LogCategory.Audit, 'audit', 'info');
export const securityLogger = createCategoryLogger(LogCategory.Security, 'security', 'warn');
export const httpLogger = createCategoryLogger(LogCategory.Http, 'http', 'http');
export const queueLogger = createCategoryLogger(LogCategory.Queue, 'queue', 'info');
export const databaseLogger = createCategoryLogger(LogCategory.Database, 'database', 'info');
export const errorLogger = createCategoryLogger(LogCategory.Error, 'errors', 'error');

if (getEnv().NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
  );
}

export function logAudit(action: string, meta: Record<string, unknown>): void {
  auditLogger.info(action, meta);
}
