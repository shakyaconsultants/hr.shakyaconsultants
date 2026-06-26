import morgan from 'morgan';
import type { Request } from 'express';
import { httpLogger } from '@logging/winston.logger.js';

morgan.token('request-id', (req: Request) => req.requestId);

export const morganMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :request-id :response-time ms',
  {
    stream: {
      write: (message: string) => {
        httpLogger.http(message.trim());
      },
    },
  },
);
