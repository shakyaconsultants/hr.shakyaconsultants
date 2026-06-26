import morgan from 'morgan';
import type { Request } from 'express';
import { httpLogger } from '@logging/winston.logger.js';
import { sanitizeUrlForLog } from '@shared/utils/sensitive-redact.util.js';

morgan.token('request-id', (req: Request) => req.requestId);
morgan.token('safe-url', (req: Request) => sanitizeUrlForLog(req.originalUrl ?? req.url));

export const morganMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :request-id :response-time ms',
  {
    stream: {
      write: (message: string) => {
        httpLogger.http(message.trim());
      },
    },
  },
);
