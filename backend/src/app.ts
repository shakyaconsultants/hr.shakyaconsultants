import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { getEnv } from '@config/env.js';
import { createCorsOptions } from '@config/cors.config.js';
import { requestIdMiddleware } from '@middleware/request-id.middleware.js';
import { correlationContextMiddleware } from '@middleware/correlation-context.middleware.js';
import { responseTimeMiddleware } from '@middleware/response-time.middleware.js';
import { createRateLimitMiddleware } from '@middleware/rate-limit.middleware.js';
import { sanitizationMiddleware } from '@middleware/sanitization.middleware.js';
import { requestLoggerMiddleware } from '@middleware/request-logger.middleware.js';
import { morganMiddleware } from '@middleware/morgan.middleware.js';
import {
  globalErrorHandler,
  notFoundHandler,
} from '@middleware/error-handler.middleware.js';
import { rootRouter } from '@modules/root/root.routes.js';
import { healthRouter } from '@modules/health/health.routes.js';
import { v1Router } from '@routes/v1/index.js';
import { setupSwagger } from '@infrastructure/swagger/swagger.setup.js';

export function createApp(): Express {
  const app = express();
  const env = getEnv();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors(createCorsOptions(env)));
  app.use(compression());
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }));
  app.use(cookieParser());

  app.use(requestIdMiddleware);
  app.use(correlationContextMiddleware);
  app.use(responseTimeMiddleware);
  app.use(createRateLimitMiddleware());
  app.use(sanitizationMiddleware);
  app.use(morganMiddleware);
  app.use(requestLoggerMiddleware);

  app.use('/', rootRouter);
  app.use('/health', healthRouter);
  app.use(env.API_PREFIX, v1Router);

  setupSwagger(app);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
